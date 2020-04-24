const _ = require('lodash')

const Helpers = require('../helpers')

class BaseStats {
  static getBaseStats(cheerio, anchor) {
    const foundEl = Helpers.searchTableOnDocument(cheerio, {
      name: 'Base stats',
      anchor
    });

    if (_.isEmpty(foundEl)) return {}

    const [{ table }] = foundEl
    const $ = cheerio();
    const $table = $(table);

    return $table
      .findArray('tr')
      .reduce((reducer, tr) => {
        return BaseStats._trToBaseStats(
          cheerio, reducer, tr
        )
      }, {});
  }

  static _trToBaseStats(cheerio, reducer, tr) {
    const $ = cheerio();
    const getByIndex = idx => $(tr).children().eq(idx).text2();
    const property = getByIndex(0);
    const propCamel = _.camelCase(property)

    reducer[propCamel] = {
      base: +getByIndex(1),
      max: +getByIndex(3),
      min: +getByIndex(4)
    };

    if (propCamel === "total") {
      delete reducer.max
      delete reducer.min
    }

    return reducer;
  }
}

module.exports = BaseStats;