const _ = require('lodash');

const Helpers = require('@crawlers/helpers')

/**
 * Get all pokedex entries.
 *
 * @class DexEntries
 */
class DexEntries {

  /**
   * Get all registers inside 'Pokédex entries' area.
   *
   * @static
   * @public
   * @param {Function} cheerio Function with page as `Cheerio` library reference.
   * @returns {any[]} List of all entries found on 'Pokédex' area.
   * @memberof DexEntries
   */
  static getPokedexEntries(cheerio) {
    const tables = Helpers.searchTableOnDocument(cheerio, { 
      h2Header: 'Pokédex entries' 
    });

    return tables
      .map(({ table, title }) => DexEntries._tableToPokeDexEntry(
        cheerio, table, title
      ));
  }

  /**
   * Convert the given table as a pokedex object entry.
   *
   * @static
   * @private
   * @param {Function} cheerio Function with page as `Cheerio` library reference.
   * @param {CheerioElement} table Table with all pokedex entries.
   * @param {String} title Table title.
   * @returns {any[]} Pokedex object entry.
   * @memberof DexEntries
   */
  static _tableToPokeDexEntry(cheerio, table, title) {
    const $ = cheerio();
    const $table = $(table);
    const rawName = _.isEmpty(title) ? $('main > h1').text2() : title;
    const pokename = _.camelCase(rawName);

    return $table
      .findArray('tr')
      .reduce((reducer, tr) => {
        const $ = cheerio();
        const $tr = $(tr);
        const $th = $tr.find('th');
        const property = _.camelCase($th.text2());
        const originalTitleParts = $th.html().split(/<[^>]*>/g);

        reducer[pokename][property] = {
          text: $tr.find('td').text2(),
          originalTitle: _.compact(originalTitleParts)
        };

        return reducer;
      }, {
        [pokename]: {}
      });
  }
}

module.exports = DexEntries;