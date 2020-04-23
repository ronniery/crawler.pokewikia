/* eslint-disable no-async-promise-executor */
const Model = require('./model');
const _ = require('lodash')

/**
 * Card model to handle all operations over the `cards` collection.
 *
 * @class Card
 * @extends {Model} Base model from this application
 */
class Card extends Model {

  /**
   * Creates an instance of Card.
   * @memberof Card
   */
  constructor() {
    super('cards');
    this.db.ensureIndex({ fieldName: 'internationalId', unique: true })
  }

  /**
   * Get all cards inside db using the given configuration to limit
   * and paginate the entire result.
   *
   * @param {number} page Number of the desired page.
   * @param {number} limit Limit of items to be returned on this request.
   * @returns {Promise<Card[]>} A page of cards with limited items.
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
   * @returns {Promise<Card[]>} List of cards found.
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