/* eslint-disable no-undef */
const { expect } = require('chai')
const { isObject, isEmpty, isArray } = require('lodash')
const request = require('supertest')

describe('Test the root entry of the application', function () {
  this.timeout(10000);

  let app;

  beforeEach(() => {
    app = require('../app')
  });

  it('Should get /.', done => {
    request(app)
      .get('/')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done)
  })

  it('Should get / to receive valid json response.', done => {
    request(app)
      .get('/')
      .end((_err, { body: { availableRoutes, message } }) => {
        expect(availableRoutes).to.be.not.null;
        expect(isArray(availableRoutes)).to.be.true
        expect(message).to.be.not.null;
        expect(message).to.be.eq('The server is correctly running!')
        done();
      });
  })

  it('Should get a 404 for all not mapped routes.', done => {
    const path = '/404'

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