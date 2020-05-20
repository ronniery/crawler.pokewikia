const _ = require('lodash');

const Helpers = require('@crawlers/helpers')

/**
 * Get all pokedex data from pokedex data section.
 *
 * @class Pokedex
 */
class Pokedex {

  /**
   * Create the full pokedex object representation.
   *
   * @static
   * @public
   * @param {Function} cheerio Function with page as `Cheerio` library reference.
   * @param {CheerioElement} anchor An element that pointers to the current anchor
   * that will be used instead the entire `document`
   * @returns {any} The reference of pokedex object with new pokedex line entries.
   * @memberof Pokedex
   */
  static getPokedex(cheerio, anchor) {
    const $ = cheerio();
    const found = Helpers.searchTableOnDocument(cheerio, { 
      h2Header: 'Pokédex data', 
      anchor 
    });
    const [{ table }] = found;
    const $table = $(table);

    return $table
      .findArray('tr')
      .reduce((dexline, tableRow) => {
        return Object.assign(
          dexline,
          Pokedex._rowToPokedexLine(() => ({ $, tr: tableRow }))
        );
      }, {
        name: $(anchor).text()
      });
  }

  /**
   * Convert the given elements in `domHandlers` to a pokedex line.
   *
   * @static
   * @private
   * @param {{$: Cheerio, tr: CheerioElement}} domHandlers The `Cheerio` reference to
   * the entire document and the table row with pokemon data that will be parsed.
   * @returns {any} The reference of pokedex object with new pokedex line entries.
   * @memberof Pokedex
   */
  static _rowToPokedexLine(domHandlers) {
    const dexline = {}
    const { nextProp, nextValue } = Pokedex._createParseableElements(
      domHandlers
    );

    // It will parse the other properties
    dexline[nextProp.replace('№', 'Id')] = nextValue;
    Pokedex._getLocalizations(dexline, nextProp, nextValue);
    Pokedex._getAbilities(dexline, nextProp, domHandlers);

    return dexline;
  }

  /**
   * Organize on a simple way with next property name that will be used as a property name
   * on pokedex line object and your value on next value object property, with that we can
   * start parse the elements to extract a poke dexline.
   *
   * @static
   * @private
   * @param {{$: Cheerio, tr: CheerioElement}} domHandlers The `Cheerio` reference to
   * the entire document and the table row with pokemon data that will be parsed.
   * @returns {{ nextProp: String, nextValue: String }} The parseable content based on
   * given handlers.
   * @memberof Pokedex
   */
  static _createParseableElements(domHandlers) {
    const getValueFrom = selector => {
      const { $, tr } = domHandlers();

      return $(tr)
        .find(selector).text2();
    }

    const thText = getValueFrom('th');

    return {
      nextProp: _.camelCase(thText),
      nextValue: getValueFrom('td')
    };
  }

  /**
   * Parse the `localNº` from pokedex section.
   *
   * @static
   * @private
   * @param {Object} dexline Current pokedex line.
   * @param {String} nextProperty A checker that will determine when run that function,
   * triggering this code only when the property 'local№' is reached.
   * @param {String} nextValue The value to be cleaned and set on the final property
   * `localizations`.
   * @memberof Pokedex
   */
  static _getLocalizations(dexline, nextProperty, nextValue) {
    if (nextProperty === 'local№') {
      // Prevent useless property on dexline
      delete dexline['localId']

      const parts = nextValue.split(/(\d{3})\s(\(.*?\))/g);
      const compacted = _.compact(parts);
      const chunks = _.chunk(compacted, 2);

      dexline.localizations = chunks
        .map(([route, game]) => {
          return {
            route, game
          };
        });
    }

    return dexline;
  }

  /**
   * Parse the abilities from pokedex section.
   *
   * @static
   * @private
   * @param {Object} dexline Current pokedex line.
   * @param {String} nextProperty A checker that will determine when run that function,
   * triggering this code only when the property 'abilities' is reached.
   * @param {{$: Cheerio, tr: CheerioElement}} domHandlers The `Cheerio` reference to
   * the entire document and the table row with pokemon data that will be parsed.
   * @memberof Pokedex
   */
  static _getAbilities(dexline, nextProperty, domHandlers) {
    if (nextProperty === 'abilities') {
      const { $, tr } = domHandlers();

      dexline.abilities = $(tr).findArray('a')
        .map(el => $(el).text2());
    }

    return dexline;
  }
}

module.exports = Pokedex;