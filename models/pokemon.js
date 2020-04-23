const Model = require('./model');
const _ = require('lodash')

class Pokemon extends Model {
  constructor() {
    super('monsters');
    this.db.ensureIndex({ fieldName: 'dexdata.name', unique: true })
  }

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