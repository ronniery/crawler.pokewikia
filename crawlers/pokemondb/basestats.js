const _ = require('lodash')
const Helpers = require('@crawlers/helpers')

/**
 * Parse the entire data for baste status from a given pokemon page.
 *
 * @class BaseStats
 */
class BaseStats {

  /**
   * Get the base status.
   *
   * @static
   * @param {CheerioStatic} cheerio Function with page as `Cheerio` library reference.
   * @param {String} anchor Anchor tab reference to extract the table from correct location.
   * @returns {any} The pokemon base status object.
   * @memberof BaseStats
   */
  static getBaseStats(cheerio, anchor) {
    const foundEl = Helpers.searchTableOnDocument(cheerio, {
      tableHeader: 'Base stats',
      anchor
    });

    if (_.isEmpty(foundEl)) return {}

    const [{ table }] = foundEl
    return BaseStats._tableToBaseStats(cheerio, table)
  }

  /**
   * Convert a given table to a object base status.
   * 
   * @static
   * @private
   * @param {CheerioStatic} cheerio Function with page as `Cheerio` library reference.
   * @param {CheerioElement} table Table element to be converted as base status.
   * @returns {any} The pokemon base status object.
   * @memberof BaseStats
   */
  static _tableToBaseStats(cheerio, table) {
    const $ = cheerio();

    return $(table)
      .findArray('tr')
      .reduce((baseStatus, tableRow) => {
        return BaseStats._createBaseStats(cheerio, baseStatus, tableRow)
      }, {});
  }

  /**
   * Convert each given table row to an object base status.
   *
   * @static
   * @private
   * @param {CheerioStatic} cheerio Function with page as `Cheerio` library reference.
   * @param {Object} baseStatus Container, that will retain all created base status when parse the given table row.
   * @param {CheerioElement} tableRow The table row (<tr>) to be parsed.
   * @returns {any} The reference container with parsed data inside it.
   * @memberof BaseStats
   */
  static _createBaseStats(cheerio, baseStatus, tableRow) {
    const $ = cheerio();
    const getByIndex = idx => $(tableRow).children().eq(idx).text2();
    const property = getByIndex(0);
    const propCamel = _.camelCase(property)

    baseStatus[propCamel] = {
      base: +getByIndex(1),
      max: +getByIndex(3),
      min: +getByIndex(4)
    };

    return baseStatus;
  }
}

module.exports = BaseStats;