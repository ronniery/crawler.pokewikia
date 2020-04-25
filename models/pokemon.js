
const _ = require('lodash')
const mongoose = require('mongoose');

class PokeSchema {

  create() {
    const schema = mongoose.Schema({
      dexdata: {
        name: { type: String, unique: true, index: true }
      }
    }, {
      collection: 'pokemons',
      strict: false,
      timestamps: true
    })

    this.setStatics(schema)
    this.setMethods(schema)
    return schema
  }

  async saveIfNotExits(doc) {
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

  toJSON() {
    const obj = this.toObject()
    delete obj.__v
    delete obj.createdAt
    delete obj.updatedAt
    return obj
  }

  setMethods(schema) {
    const { methods } = schema
    methods.toJSON = this.toJSON
    return schema
  }

  setStatics(schema) {
    const { statics } = schema
    statics.saveIfNotExits = this.saveIfNotExits
    return schema
  }
}

module.exports = mongoose.model('Pokemon', new PokeSchema().create());