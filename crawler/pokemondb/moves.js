const _ = require('lodash');

class Moves {

  // TODO: The module is broken and need refactor
  static getMoves(cheerio) {
    const $ = cheerio();
    const moviments = {};
    const allTabs = $('.tabset-moves-game .tabs-tab-list a')
      .toArray();

    allTabs.forEach(tab => {
      const tabmoves = Moves._getTabMoves(cheerio, tab);
      const tabtext = $(tab).text();
      moviments[_.camelCase(tabtext)] = tabmoves;
    });

    return moviments;
  }

  static _getTabMoves(cheerio, tab) {
    const $ = cheerio();
    const $where = $($(tab).attr('href'));
    $where.find('p').remove();

    return $where
      .findArray('h3')
      .map(el => {
        const $el = $(el);

        return {
          title: $el.text(),
          table: $el.next().find('table')
        };
      }).reduce((reducer, { title, table }) => {
        return Moves._tableToMoves(cheerio, reducer, title, table);
      }, {});
  }

  static _tableToMoves(cheerio, reducer, title, table) {
    const $ = cheerio();
    const allMoves = $(table)
      .findArray('tbody tr')
      .map(tr => {
        const tds = $(tr).find('td');

        return {
          level: +tds.eq(0).text(),
          move: tds.eq(1).text(),
          type: tds.eq(2).text(),
          category: {
            img: tds.eq(3).find('img').attr('src'),
            title: tds.eq(3).find('img').attr('title')
          },
          power: tds.eq(4).text(),
          accuracy: tds.eq(5).text()
        };
      });

    reducer[_.camelCase(title)] = allMoves;
    return reducer;
  }
}

module.exports = Moves;