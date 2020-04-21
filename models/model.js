/* eslint-disable no-undef */
const Datastore = require('nedb');
const _ = require('lodash');
const path = require('path');

module.exports = class Model {
  constructor(dbname) {
    this.db = new Datastore({
      filename: path.join(__dirname, `../db/${dbname}.db`),
      autoload: true
    })
  }

  async save(doc) {
    return new Promise((resolve, reject) => {
      this.db.insert(doc, function (err) {
        if (_.some(err)) reject(err)
        resolve()
      })
    })
  }

  async findOne(filter) {
    return new Promise((resolve, reject) => {
      this.db.findOne(filter, function (err, doc) {
        if (_.some(err)) reject(err)
        resolve(doc)
      })
    })
  }

  async existsAny(filter) {
    const found = await this.findOne(filter);
    return _.some(found)
  }
}