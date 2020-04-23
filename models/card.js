/* eslint-disable no-async-promise-executor */
const Model = require('./model');
const _ = require('lodash')

class Card extends Model {
  constructor() {
    super('cards');
    this.db.ensureIndex({ fieldName: 'internationalId', unique: true })
  }

  /**
   * 
   *
   * @param {number} page
   * @param {number} limit
   * @returns
   * @memberof Card
   */
  async getPaginatedCards(page, limit) {
    return new Promise((resolve, reject) => {
      const { db } = this;

      db.count({}, function (err, totalOfDocs) {
        if (_.some(err)) reject(err)

        db
          .find({})
          .sort({ internationalId: 1 })
          .skip((page - 1) * limit)
          .limit(limit * 1)
          .exec(function (err, docs) {
            if (_.some(err)) reject(err)

            resolve({
              totalPages: Math.round(totalOfDocs / limit),
              cardPages: docs
            })
          });
      })
    })
  }

  /**
   * Get all cards from db that match with the given search term
   * limiting the total of found items with the `limit` param.
   *
   * @param {string} searchTerm Term to search cards.
   * @param {string} limit Limit of items to be returned on query.
   * @returns {Promise<Card>} List of cards found.
   * @memberof Card
   */
  async getMatchCards(searchTerm, limit) {
    return new Promise((resolve, reject) => {
      const { db } = this;

      db.find({}, function (err, allDocs) {
        if (_.some(err)) reject(err)

        resolve(
          allDocs
            // Filter for match elements
            .filter(({ name }) => {
              return new RegExp(searchTerm, 'gi')
                .test(name)
            })
            // Sort by Iid
            .sort((prev, next) =>
              +prev.internationalId - +next.internationalId
            )
            // Remove _id
            .flatMap(item => {
              delete item._id;
              return item
            })
            .slice(0, limit)
        )
      })
    })
  }

  /**
   * Check if exists any item inside db using filter as searcher.
   *
   * @param {object} filter Filter configuration to search elements in db collection.
   * @returns {Promise<boolean>} Flag indicating the existence or not.
   */
  async existsAny(filter) {
    return _.some(
      await this.findOne(filter)
    )
  }
}

module.exports = Card;