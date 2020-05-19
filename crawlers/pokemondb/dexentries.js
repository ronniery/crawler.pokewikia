const _ = require('lodash');

const Helpers = require('@crawlers/helpers')

class DexEntries {
  static getPokedexEntries(cheerio) {
    const tables = Helpers.searchTableOnDocument(cheerio, { 
      h2Header: 'Pokédex entries' 
    });

    return tables
      .map(({ table, title }) => DexEntries._trToPokeDexEntry(
        cheerio, table, title
      ));
  }

  static _trToPokeDexEntry(cheerio, table, title) {
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