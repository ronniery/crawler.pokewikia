// /* eslint-disable no-async-promise-executor */
const _ = require('lodash')
const mongoose = require('mongoose');

const allowedFields = {
  types: 1,
  internationalId: 1,
  sprite: 1,
  name: 1,
  _id: 0
}

const cardSchema = new mongoose.Schema({
  internationalId: { type: String, unique: true, index: true },
  sprite: { type: String },
  name: { type: String },
  types: [{ type: String }]
}, {
  collection: 'cards',
  timestamps: true
})

cardSchema.statics.getMatchCards = async function (searchTerm, limit) {
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

cardSchema.statics.getPaginatedCards = async function (page, limit) {
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

module.exports = mongoose.model('Card', cardSchema);