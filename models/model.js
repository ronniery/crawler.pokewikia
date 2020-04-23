/* eslint-disable no-undef */
const Datastore = require('nedb');
const _ = require('lodash');
const path = require('path');

/**
 * The main model application, that contains the generic methods to access data on db.
 *
 * @class Model
 */
class Model {

  /**
   * Creates an instance of Model.
   * @param {string} collection Collection name to initialize dtabase
   * @memberof Model
   */
  constructor(collection) {
    this.db = new Datastore({
      filename: path.join(__dirname, `../db/${collection}.db`),
      autoload: true
    })
  }

  /**
   * Save the given document on database.
   *
   * @param {any} doc Document to be saved on db.
   * @returns {Promise<void|Error>} Promise that resolve when the document is saved.
   * @memberof Model
   */
  async save(doc) {
    return new Promise((resolve, reject) => {
      this.db.insert(doc, function (err) {
        if (_.some(err)) reject(err)
        resolve()
      })
    })
  }

  /**
   * Search one element that matches with the given filter
   *
   * @param {any} filter The filter to seach document.
   * @returns {Promise<void|Error>} Promise that resolve when the document is searched.
   * @memberof Model
   */
  async findOne(filter) {
    return new Promise((resolve, reject) => {
      this.db.findOne(filter, function (err, doc) {
        if (_.some(err)) reject(err)
        resolve(doc)
      })
    })
  }
}

module.exports = Model;