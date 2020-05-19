/* eslint-disable no-undef */
const { expect } = require('chai');
const _ = require('lodash');
const { isObject, isEmpty } = _;
const Schema = require('./utils/schema')
const Ajv = require('ajv');
const request = require('supertest');
const Pokemon = require('../models/pokemon')

describe('Test /pokemon route', function () {
  this.timeout(20000);

  let app;
  let ajv;

  beforeEach(async () => {
    app = require('../app')
    ajv = new Ajv();
  });


  it('Should get /pokemon with empty pokename.', done => {
    request(app)
      .get('/pokemon')
      .expect('Content-Type', /html/)
      .expect(500)
      .end((_err, { body }) => {
        expect(body).to.eql({
          status: "ERROR",
          message: "Empty pokemon name, check it and try again."
        });

        done();
      })
  })

  it('Should get /pokemon with invalid pokename.', done => {
    request(app)
      .get('/pokemon')
      .query({ name: 'Homer simpson ' })
      .expect('Content-Type', /html/)
      .expect(200)
      .end((_err, { statusCode, text }) => {
        expect(statusCode).to.equal(404);
        expect(text).to.contains('<h1>Page not found</h1>')
        done();
      })
  })

  it('Should get /pokemon with valid pokename.', done => {
    request(app)
      .get('/pokemon')
      .query({ name: 'Rattata' })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        expect(isObject(body)).to.be.true
        done();
      })
  })

  it('Should get /pokemon at borders.', done => {
    Pokemon
      .deleteMany({})
      .then(() => {
        request(app)
          .get('/pokemon')
          .query({ name: 'Rattata' })
          .expect('Content-Type', /json/)
          .expect(200)
          .end((_err, { body }) => {
            expect(isObject(body)).to.be.true
            done();
          })
      })
  })

  it('Should get a 404 for all not mapped routes.', done => {
    const path = '/pokemon/404'

    request(app)
      .get(path)
      .end((_err, { statusCode, body, error }) => {
        expect(statusCode).to.equal(404);
        expect(isObject(body) && isEmpty(body)).to.be.true;
        expect(error).to.be.not.null;
        expect(error.message).to.be.eq(`cannot GET ${path} (404)`)
        done();
      });
  })

  describe('Test the pokemon api response.', function () {
    const validateWithSchemaFor = async (pokename, testComplete) => {
      const schemas = await Schema.load(pokename)

      request(app)
        .get('/pokemon')
        .query({ name: pokename })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((_err, { body }) => {
          const bodyKeys = Object.keys(body)

          bodyKeys.forEach(key => {
            const schema = schemas[key]
            const target = {
              [key]: body[key]
            }

            if (!isEmpty(schema)) {
              // Skip some mongo properties
              const validator = ajv.compile(schema);
              const result = validator(target);

              expect(validator.errors).to.be.null
              expect(result).to.be.true;
            }
          })

          testComplete();
        })
    }

    it('Should get /pokemon Rattata data and validate it with schema.', done => {
      validateWithSchemaFor('rattata', done)
    })

    it('Should get /pokemon Charizard data and validate it with schema.', done => {
      validateWithSchemaFor('charizard', done)
    })
  })
})