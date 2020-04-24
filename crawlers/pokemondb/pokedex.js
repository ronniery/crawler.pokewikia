const _ = require('lodash');

const Helpers = require('../helpers');

class Pokedex {

  static getPokedex(cheerio, anchor) {
    const $ = cheerio();
    const [{ table }] = Helpers.searchTableOnDocument(cheerio, { name: 'Pokédex data', anchor });
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
    const { property, data, tdText } = Pokedex._createParseableElements(
      domHandlers
    );

    // It will parse the other properties
    data[property.replace('№', 'Id')] = tdText;

    // TODO: Check if the code was broken after changes - and that will override properly
    Pokedex._getLocalizations(data, property, tdText);
    Pokedex._getAbilities(data, domHandlers, property);

    return data;
  }

  static _createParseableElements(domHandlers) {
    const data = {};
    const { $, tr } = domHandlers();
    const getValueFrom = selector => $(tr)
      .find(selector).text2();
    const tdText = getValueFrom('td');
    const thText = getValueFrom('th');
    const property = _.camelCase(thText);

    return { property, data, tdText };
  }

  static _getLocalizations(reducer, property, rawValue) {
    if (property === 'local№') {
      const parts = rawValue.split(/(\d{3})\s(\(.*?\))/g);
      const compacted = _.compact(parts);
      const chunks = _.chunk(compacted, 2);

      reducer.localizations = chunks
        .map(([route, game]) => {
          return {
            route, game
          };
        });
    }

    return reducer;
  }

  static _getAbilities(reducer, domHandlers, property) {
    const { $, tr } = domHandlers();

    if (property === 'abilities') {
      reducer.abilities = $(tr).findArray('a')
        .map(el => $(el).text2());
    }

    return reducer;
  }
}

module.exports = Pokedex;