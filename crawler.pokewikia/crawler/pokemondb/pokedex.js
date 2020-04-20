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
    const data = {};
    const { $, tr } = domHandlers();
    const getValueFrom = selector => $(tr)
      .find(selector).text2();
    const tdText = getValueFrom('td');
    const thText = getValueFrom('th');
    const property = _.camelCase(thText);

    if (property === 'local№') {
      Pokedex._getLocalizations(data, property, tdText);
    } else if (property === 'abilities') {
      Pokedex._getAbilities(domHandlers, data, property);
    } else {
      data[property.replace('№', 'Id')] = tdText;
    }

    return data;
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
  }

  static _getAbilities(domHandlers, reducer, property) {
    const { $, tr } = domHandlers();

    if (property === 'abilities') {
      reducer.abilities = $(tr).findArray('a')
        .map(el => $(el).text2());
    }
  }
}

module.exports = Pokedex;