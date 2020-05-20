
const _ = require('lodash')
const mongoose = require('mongoose');

/**
 * Pokemon schema generator to create the schema and set the custom static methods.
 *
 * @class PokeSchema
 */
class PokeSchema {

  /**
   * Create and prepare the pokemon schema to be used.
   *
   * @returns {Schema<Pokemon>} Prepared pokemon schema.
   * @memberof PokeSchema
   */
  create() {
    const schema = mongoose.Schema({
      dexdata: {
        name: { 
          type: String, 
          unique: true, 
          index: true 
        }
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

  /**
   * Save a document if it not exists on database.
   *
   * @param {any} doc Document to be saved.
   * @returns {Promise<any>} The *findOne* promise resolver.
   * @memberof PokeSchema
   */
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

  /**
   * Converts the mongoose object to json.
   *
   * @override
   * @returns {Object} The converted and cleaned object without mongoose properties.
   * @memberof PokeSchema
   */
  toJSON() {
    const obj = this.toObject()
    delete obj.__v
    delete obj.createdAt
    delete obj.updatedAt
    return obj
  }

  /**
   * Set functions on `methods` mongoose property.
   *
   * @param {Schema<Pokemon>} schema Schema that will be injected the functions.
   * @returns {Schema<Pokemon>} Schema with functions injected on the property `methods`.
   * @memberof PokeSchema
   */
  setMethods(schema) {
    const { methods } = schema
    methods.toJSON = this.toJSON
    return schema
  }

  /**
   * Set static functions on `statics` mongoose property.
   *
   * @param {Schema<Pokemon>} schema Schema that will be injected the functions.
   * @returns {Schema<Pokemon>} Schema with functions injected on the property `statics`.
   * @memberof PokeSchema
   */
  setStatics(schema) {
    const { statics } = schema
    statics.saveIfNotExits = this.saveIfNotExits
    return schema
  }
}

module.exports = mongoose.model('Pokemon', new PokeSchema().create());