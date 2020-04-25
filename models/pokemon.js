
const _ = require('lodash')
const mongoose = require('mongoose');

const pokemonSchema = mongoose.Schema({
  dexdata: {
    name: { type: String, unique: true, index: true }
  }
}, {
  collection: 'pokemons',
  strict: false,
  timestamps: true
})

pokemonSchema.statics.saveIfNotExits = async function (doc) {
  const Model = this.model('Pokemon')
  const copy = _.cloneDeep(doc)

  delete copy.border.next.pokemon;
  delete copy.border.prev.pokemon;

  return Model.findOne({
    'dexdata.name': copy.dexdata.name
  }).then(async found => {
    if (_.isEmpty(found)) {
      await new Model(doc).save();
    }
  })
}

pokemonSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.__v
  delete obj.createdAt
  delete obj.updatedAt
  return obj
}

module.exports = mongoose.model('Pokemon', pokemonSchema);