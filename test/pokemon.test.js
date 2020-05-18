/* eslint-disable no-undef */
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const { isObject, isEmpty, isArray } = _;
const Ajv = require('ajv');
const request = require('supertest');

describe('Test /pokemon route', function () {
  this.timeout(10000);

  let app;
  let ajv;

  beforeEach(() => {
    app = require('../app')
    ajv = new Ajv();
  });

  it('Should get /pokemon with empty pokename.', done => {
    request(app)
      .get('/pokemon')
      .expect('Content-Type', /html/)
      .expect(500)
      .end((_err, response) => {
        expect(response.text).to.be.equal("Empty pokemon name, check it and try again.");
        done();
      })
  })

  it('Should get /pokemon with invalid pokename.', done => {
    request(app)
      .get('/pokemon')
      .query({ name: 'Hommer simpson ' })
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
    it('Should get /pokemon Rattata data and validate it.', async done => {
      const schemas = await Schema.load('rattata')

      request(app)
        .get('/pokemon')
        .query({ name: 'Rattata' })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((_err, { body }) => {
          const bodyKeys = Object.keys(body)

          bodyKeys.forEach(key => {
            console.log(key)
            const schema = schemas[key]
            const target = { 
              [key]: body[key]
            }

            if (!isEmpty(schema)) {

              if(key === "moves") {
                let x = 1
              }

              // Skipp some mongo properties
              const validator = ajv.compile(schema);
              const result = validator(target);

              expect(validator.errors).to.be.null
              expect(result).to.be.true;
            }
          })

          done();
        })
    })
  })

  // it('Should get /card and verify card response with schema.', done => {
  //   const schema = require('./schemas/card/raw-cards.json')

  //   request(app)
  //     .get('/card')
  //     .set('Accept', 'application/json')
  //     .expect('Content-Type', /json/)
  //     .end((_err, { statusCode, body }) => {
  //       expect(statusCode).to.equal(200);
  //       expect(isArray(body)).to.be.true;
  //       expect(body.length).to.be.eq(10);

  //       const { errors } = validator.validate(body, schema);
  //       expect(isEmpty(errors)).to.be.true;
  //       done();
  //     });
  // })

  // it('Should get /card first 15 items with limit parameter.', done => {
  //   request(app)
  //     .get('/card')
  //     .query({ limit: 15 })
  //     .set('Accept', 'application/json')
  //     .expect('Content-Type', /json/)
  //     .end((_err, { statusCode, body }) => {
  //       expect(statusCode).to.equal(200);
  //       expect(isArray(body)).to.be.true;
  //       expect(body.length).to.be.eq(15);
  //       done();
  //     });
  // })

  // it('Should get /card 25 items with limit parameter.', done => {
  //   const totalOfItems = 25

  //   request(app)
  //     .get('/card')
  //     .query({ limit: totalOfItems })
  //     .set('Accept', 'application/json')
  //     .expect('Content-Type', /json/)
  //     .end((_err, { statusCode, body }) => {
  //       expect(statusCode).to.equal(200);
  //       expect(isArray(body)).to.be.true;
  //       expect(body.length).to.be.eq(totalOfItems);
  //       done();
  //     });
  // })

  // it('Should get /card using page parameter.', done => {
  //   request(app)
  //     .get('/card')
  //     .query({ page: 2 })
  //     .set('Accept', 'application/json')
  //     .expect('Content-Type', /json/)
  //     .end((_err, { body }) => {
  //       const bodyPage2 = body;

  //       request(app)
  //         .get('/card')
  //         .query({ page: 3 })
  //         .end((_err, { body }) => {
  //           const hasDiff = _(bodyPage2)
  //             .differenceWith(body, _.isEqual)
  //             .isEmpty();

  //           expect(hasDiff).to.be.false
  //           done();
  //         })
  //     });
  // })

  // it('Should get a 404 for all not mapped routes.', done => {
  //   const path = '/card/404'

  //   request(app)
  //     .get(path)
  //     .end((_err, { statusCode, body, error }) => {
  //       expect(statusCode).to.equal(404);
  //       expect(isObject(body) && isEmpty(body)).to.be.true;
  //       expect(error).to.be.not.null;
  //       expect(error.message).to.be.eq(`cannot GET ${path} (404)`)
  //       done();
  //     });
  // })

  // it('Should get /card checking for total of items on header.', done => {
  //   request(app)
  //     .get('/card')
  //     .end((_err, { header }) => {
  //       expect(header['x-total-pages']).to.be.not.null;
  //       expect(+header['x-total-pages']).to.be.gt(85)
  //       done();
  //     });
  // })
})

class Schema {
  static async load(schemeName) {
    return new Promise((resolve, reject) => {
      const schemaPath = path.join(__dirname, `./schemas/pokemons/${schemeName}`)

      fs.readdir(schemaPath, (err, files) => {
        if (err) reject(err)

        const schemas = files.reduce((reducer, schema) => {
          const content = fs.readFileSync(`${schemaPath}/${schema}`)

          reducer[
            schema.replace('.json', '')
          ] = JSON.parse(content.toString())

          return reducer
        }, {})

        resolve(schemas)
      })
    })
  }
}