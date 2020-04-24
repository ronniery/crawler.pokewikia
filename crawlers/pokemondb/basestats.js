const _ = require('lodash')

const Helpers = require('@crawlers/helpers')

class BaseStats {
  static getBaseStats(cheerio, anchor) {
    const foundEl = Helpers.searchTableOnDocument(cheerio, {
      name: 'Base stats',
      anchor
    });

    if (_.isEmpty(foundEl)) return {}

    const [{ table }] = foundEl

    return BaseStats._tableToBaseStats(cheerio, table)
  }

  static _tableToBaseStats(cheerio, table) {
    const $ = cheerio();

    return $(table)
      .findArray('tr')
      .reduce((reducer, tr) => {
        return BaseStats._createBaseStats(cheerio, reducer, tr)
      }, {});
  }

  static _createBaseStats(cheerio, reducer, tr) {
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