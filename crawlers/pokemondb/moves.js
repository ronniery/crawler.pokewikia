const _ = require('lodash');

const Helpers = require('@crawlers/helpers')
const tabSelector = '.tabset-moves-game .tabs-tab-list a';

// TODO: There is a bug here that see Rattata and see there is 2 tabs, the parser is wrong
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
    const titledTables = $content
      .map(elContent => {
        const $el = $(elContent);

        return {
          title: $el.text2(),
          table: $el.next().find('table')
        };
      })

    return Moves._createTabMoves(cheerio, titledTables)
  }

  static _createTabMoves(cheerio, titledTables) {
    return titledTables
      .reduce((tabmoves, { title, table }) => {
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
        const categorySpan = tds.eq(3).find('span');

        return {
          level: +tds.eq(0).text2(),
          move: tds.eq(1).text2(),
          type: tds.eq(2).text2(),
          category: {
            img: Helpers.getImgSrc($, categorySpan),
            title: $(categorySpan).attr('title')
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