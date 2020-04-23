const Model = require('./model');
const _ = require('lodash')

/**
 * Pokemon model to handle all operations over the `monsters` collection.
 *
 * @class Pokemon
 * @extends {Model} Base model from this application
 */
class Pokemon extends Model {

  /**
   * Creates an instance of Pokemon.
   * @memberof Pokemon
   */
  constructor() {
    super('monsters');
    this.db.ensureIndex({ fieldName: 'dexdata.name', unique: true })
  }

  /**
   * Save the given document if it does not exists on db.
   *
   * @param {object} doc Document to be saved on db.
   * @returns {Promise<void|Error>} Promise that resolve when the document is saved.
   * @memberof Pokemon
   */
  async saveIfNotExits(doc) {
    const copy = _.cloneDeep(doc)
    delete copy.border.next.pokemon;
    delete copy.border.prev.pokemon;

    return await this.findOne({
      'dexdata.name': copy.dexdata.name
    }).then(async found => {
      if (_.isEmpty(found)) {
        await super.save(doc);
      }
    })
  }
}

module.exports = Pokemon;