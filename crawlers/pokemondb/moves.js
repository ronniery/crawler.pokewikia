const _ = require('lodash');

const tabSelector = '.tabset-moves-game .tabs-tab-list a';

class Moves {

  static getMoves(cheerio) {
    const $ = cheerio();

    return $(tabSelector)
      .toArray()
      .reduce((moves, tab) => {
        const allMoves = Moves._getAllMovesFromTab(cheerio, tab);
        const tabName = $(tab).text();

        moves[_.camelCase(tabName)] = allMoves;
        return moves;
      }, {});
  }

  static _getAllMovesFromTab(cheerio, tab) {
    const $ = cheerio()
    const $content = Moves._findTabContent(cheerio, tab)

    $content
      .map(elContent => {
        const $el = $(elContent);

        return {
          title: $el.text2(),
          table: $el.next().find('table')
        };
      }).reduce((tabmoves, { title, table }) => {
        tabmoves[_.camelCase(title)] = Moves._tableToMoves(cheerio, table);
        return tabmoves;
      }, {});
  }

  static _tableToMoves(cheerio, table) {
    const $ = cheerio();

    return $(table)
      .findArray('tbody tr')
      .map(tr => {
        const tds = $(tr).find('td');

        return {
          level: +tds.eq(0).text2(),
          move: tds.eq(1).text2(),
          type: tds.eq(2).text2(),
          category: {
            img: tds.eq(3).find('img').attr('src'),
            title: tds.eq(3).find('img').attr('title')
          },
          power: tds.eq(4).text2(),
          accuracy: tds.eq(5).text2()
        };
      });
  }

  static _findTabContent(cheerio, tab) {
    const $ = cheerio();
    const $where = $($(tab).attr('href'));

    return $where
      .find('p').remove()
      .end().findArray('h3')
  }
}

module.exports = Moves;