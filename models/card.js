// /* eslint-disable no-async-promise-executor */
const _ = require('lodash')
const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Specifies allowed fields
 */
const allowedFields = {
  types: 1,
  internationalId: 1,
  sprite: 1,
  name: 1,
  _id: 0
}

/**
 * Card schema generator to create the schema and set the custom static methods
 *
 * @class CardSchema
 */
class CardSchema {

  /**
   * Create and prepare the card schema to be used.
   *
   * @returns {Schema<Card>} Prepared card schema
   * @memberof CardSchema
   */
  create() {
    const schema = new Schema({
      internationalId: { 
        type: String, 
        unique: true, 
        index: true 
      },
      sprite: { type: String },
      name: { type: String },
      types: [{ type: String }]
    }, {
      collection: 'cards',
      timestamps: true
    })

    return this.setStatics(schema);
  }

  /**
   *
   *
   * @param {string} searchTerm
   * @param {number} limit
   * @returns {Promise<Card[]>}
   * @memberof CardSchema
   */
  async getMatchCards(searchTerm, limit) {
    const Model = this.model('Card')

    return new Promise((resolve, reject) => {
      Model.find({
        "name": new RegExp(`.*${searchTerm}.*`, 'i')
      }, allowedFields)
        .sort({ internationalId: 1 })
        .limit(limit)
        .exec(function (err, docs) {
          if (_.some(err)) reject(err)

          resolve(docs)
        })
    })
  }

  /**
   *
   *
   * @param {number} page
   * @param {number} limit
   * @returns {Promise<Card[]>}
   * @memberof CardSchema
   */
  async getPaginatedCards(page, limit) {
    const Model = this.model('Card')
    const totalOfDocs = await Model
      .countDocuments({})
  
    return new Promise((resolve, reject) => {
      Model
        .find({}, allowedFields)
        .sort({ internationalId: 1 })
        .skip((page - 1) * limit)
        .limit(limit * 1)
        .exec(function (err, docs) {
          if (_.some(err)) reject(err)
  
          resolve({
            totalPages: Math.round(totalOfDocs / limit),
            cardPages: docs
          })
        })
    })
  }

  /**
   *
   *
   * @param {Schema<Card>} schema
   * @returns
   * @memberof CardSchema
   */
  setStatics(schema) {
    const { statics } = schema

    statics.getMatchCards = this.getMatchCards
    statics.getPaginatedCards = this.getPaginatedCards

    return schema
  }
}

module.exports = mongoose.model('Card', new CardSchema().create());