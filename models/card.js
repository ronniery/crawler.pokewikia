/* eslint-disable no-async-promise-executor */
const Model = require('./model');
const _ = require('lodash')

class Card extends Model {
  constructor() {
    super('cards');
    this.db.ensureIndex({ fieldName: 'internationalId', unique: true })
  }

  async getAllPaginated(page, limit) {
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
}

module.exports = Card;