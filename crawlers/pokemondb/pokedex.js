const _ = require('lodash');

const Helpers = require('@crawlers/helpers')

class Pokedex {

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
      .reduce((reducer, tr) => {
        return Object.assign(
          reducer,
          Pokedex._rowToPokedexLine(() => ({ $, tr }))
        );
      }, {
        name: $(anchor).text()
      });
  }

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

  static _getAbilities(dexline, nextProperty, domHandlers) {
    const { $, tr } = domHandlers();

    if (nextProperty === 'abilities') {
      dexline.abilities = $(tr).findArray('a')
        .map(el => $(el).text2());
    }

    return dexline;
  }
}

module.exports = Pokedex;