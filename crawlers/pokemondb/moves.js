const _ = require('lodash');

const Helpers = require('@crawlers/helpers')
const tabSelector = '.tabset-moves-game > .tabs-tab-list a';

// TODO: There is a bug here that see Rattata and see there is 2 tabs, the parser is wrong
class Moves {

  static getMoves(cheerio, pokename) {
    const $ = cheerio();

    return $(tabSelector)
      .toArray()
      .reduce((moves, tab) => {
        const allMoves = Moves._getAllMovesFromTab(cheerio, pokename, tab);
        const tabName = $(tab).text();
        moves[_.camelCase(tabName)] = allMoves;
        
        return moves;
      }, {});
  }

  static _getAllMovesFromTab(cheerio, pokename, tab) {
    const $ = cheerio()
    const $content = Moves._findTabContent(cheerio, pokename, tab)
    const titledTables = $content
      .map(elContent => {
        const $el = $(elContent);
        const nextEl = $el.next()

        let anchor = null
        let tables = [{
          [anchor]: $el.next().find('table')
        }]

        if ($(nextEl).hasClass('tabs-wrapper')) {
          tables = $el
            .next()
            .find('.tabs-tab-list a')
            .toArray()
            .map(a => {
              const id = $(a).attr('href')

              return {
                [$(a).text2()]: $(id).find('table')
              }
            })
        }

        return {
          title: $el.text2(),
          tables
        };
      })

    return Moves._createTabMoves(cheerio, titledTables)
  }

  static _createTabMoves(cheerio, titledTables) {
    return titledTables
      .reduce((tabmoves, { title, anchor, tables }) => {
        tabmoves[_.camelCase(title)] = Moves._tablesToMoves(
          cheerio, anchor, tables
        );

        return tabmoves;
      }, {});
  }

  static _tablesToMoves(cheerio, anchor, tables) {
    const $ = cheerio();
    const moves = []

    tables.forEach(item => {
      const [tableKey] = Object.keys(item)
      const table = item[tableKey]
      const current = $(table)
        .findArray('tbody tr')
        .map(tr => {
          const tds = $(tr).find('td');
          const categorySpan = tds.eq(3).find('span');
          const hasSixTds = _.size(tds) === 6
          const base = hasSixTds ? 1 : 0
          const move = {
            referenceTo: _.isEmpty(tableKey) ? 'both' : tableKey,
            move: tds.eq(base).text2(),
            type: tds.eq(base + 1).text2(),
            category: {
              img: Helpers.getImgSrc($, categorySpan),
              title: $(categorySpan).attr('title')
            },
            power: tds.eq(base + 3).text2(),
            accuracy: tds.eq(base + 4).text2()
          };

          if (hasSixTds) {
            const thead = _.first($(table).find('thead th'))
            const header = $(thead).text2() === "Lv." ? "level" : "tm"
            move[header] = $(_.first(tds)).text2()
          }

          return move
        });

      moves.push([...current, ...moves])
    })

    return _.flatten(moves)
  }

  static _findTabContent(cheerio, pokename, tab) {
    const $ = cheerio();
    const $where = $($(tab).attr('href'));

    return $where
      .find('p').remove()
      .end().findArray('h3')
  }
}

module.exports = Moves;