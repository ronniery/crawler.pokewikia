/* eslint-disable no-undef */
const { expect } = require('chai')
const _ = require('lodash')
const { isObject, isEmpty, isArray, isEqual } = _
const Ajv = require('ajv');
const request = require('supertest');
const Card = require('../models/card')

describe('Test /card route', function () {
  this.timeout(20000);

  let app;
  let ajv;

  beforeEach(async () => {
    app = require('../app')
    ajv = new Ajv();
  });

  after(async function () {
    await Card
      .deleteMany({})
  })

  it('Should get /card with json response.', done => {
    request(app)
      .get('/card')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done)
  })

  it('Should get /card initalizing db first.', done => {
    Card
      .deleteMany({})
      .then(() => {
        request(app)
          .get('/card')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200, done)
      })
  })

  it('Should get /card and verify card response with schema.', done => {
    const schema = require('./schemas/card/card-list.json')

    request(app)
      .get('/card')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((_err, { statusCode, body }) => {
        expect(statusCode).to.equal(200);
        expect(isArray(body)).to.be.true;
        expect(body.length).to.be.eq(10);

        const validator = ajv.compile(schema);
        const result = validator(body);

        expect(validator.errors).to.be.null
        expect(result).to.be.true;
        done();
      });
  })

  it('Should get /card first 15 items with limit parameter.', done => {
    request(app)
      .get('/card')
      .query({ limit: 15 })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((_err, { statusCode, body }) => {
        expect(statusCode).to.equal(200);
        expect(isArray(body)).to.be.true;
        expect(body.length).to.be.eq(15);
        done();
      });
  })

  it('Should get /card with more than 50 items.', done => {
    request(app)
      .get('/card')
      .query({ limit: 60 })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((_err, { statusCode, body }) => {
        expect(statusCode).to.equal(200);
        expect(isArray(body)).to.be.true;
        expect(body.length).to.be.eq(10);
        done();
      });
  })

  it('Should get /card 25 items with limit parameter.', done => {
    const totalOfItems = 25

    request(app)
      .get('/card')
      .query({ limit: totalOfItems })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((_err, { statusCode, body }) => {
        expect(statusCode).to.equal(200);
        expect(isArray(body)).to.be.true;
        expect(body.length).to.be.eq(totalOfItems);
        done();
      });
  })

  it('Should get /card using page parameter.', done => {
    request(app)
      .get('/card')
      .query({ page: 2 })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((_err, { body }) => {
        const bodyPage2 = body;

        request(app)
          .get('/card')
          .query({ page: 3 })
          .end((_err, { body }) => {
            const hasDiff = _(bodyPage2)
              .differenceWith(body, _.isEqual)
              .isEmpty();

            expect(hasDiff).to.be.false
            done();
          })
      });
  })

  it('Should get /card checking for total of items on header.', done => {
    request(app)
      .get('/card')
      .end((_err, { header }) => {
        expect(header['x-total-pages']).to.be.not.null;
        expect(+header['x-total-pages']).to.be.gt(85)
        done();
      });
  })

  it('Should get /card/search with multiple matches.', done => {
    request(app)
      .get('/card/search')
      .query({ term: 'bul' })
      .end((_err, { body }) => {
        expect(body.length).to.be.eq(4);

        const cardNames = body.map(({ name }) => name)
        const areEqual = isEqual(cardNames, [
          'Bulbasaur', 'Snubbull',
          'Granbull', 'Tapu Bulu'
        ])

        expect(areEqual).to.be.true
        done();
      });
  })

  it('Should get /card/search cards with single match.', done => {
    request(app)
      .get('/card/search')
      .query({ term: 'Rattata' })
      .end((_err, { body }) => {
        expect(body.length).to.be.eq(1);

        const areEqual = isEqual(body.map(({ name }) => name), ['Rattata'])
        expect(areEqual).to.be.true
        done();
      });
  })

  it('Should get /card/search initalizing db first.', done => {
    Card
      .deleteMany({})
      .then(() => {
        request(app)
          .get('/card/search')
          .query({ term: 'Rattata' })
          .end((_err, { body }) => {
            expect(body.length).to.be.eq(1);

            const areEqual = isEqual(body.map(({ name }) => name), ['Rattata'])
            expect(areEqual).to.be.true
            done();
          });
      })
  })

  it('Should get /card/search and throws error with empty term.', done => {
    request(app)
      .get('/card/search')
      .query({ term: '' })
      .expect(500)
      .end((_err, { body }) => {
        expect(body).to.eql({
          status: "ERROR",
          message: "Empty searchTerm, check it and try again."
        });

        done();
      });
  })

  it('Should get a 404 for all not mapped routes.', done => {
    const path = '/card/404'

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
})