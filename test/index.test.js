/* eslint-disable no-undef */
const chai = require('chai')
const request = require('supertest')

describe('Testing the root entry of the application', () => {
  let app;
  
  beforeEach(function () {
    app = require('../app')
  });

  it('Should get /', done => {
    request(app)
      .get('/')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done)
  })
})