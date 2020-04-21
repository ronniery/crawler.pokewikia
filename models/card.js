/* eslint-disable no-async-promise-executor */
const Model = require('./model');
const _ = require('lodash')

class Card extends Model {
  constructor() {
    super('cards');
    this.db.ensureIndex({ fieldName: 'internationalId', unique: true })
  }

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

  async getMatchCards(searchTerm, limit) {
    return new Promise((resolve, reject) => {
      const { db } = this;

      db.find({}, function (err, allDocs) {
        if (_.some(err)) reject(err)

        resolve(
          allDocs
            .filter(({ name }) => {
              return new RegExp(searchTerm, 'gi')
                .test(name)
            })
            .sort((prev, next) =>
              +prev.internationalId - +next.internationalId
            )
            .flatMap(item => {
              delete item._id;
              return item
            })
            .slice(0, limit)
        )
      })
    })
  }
}

module.exports = Card;