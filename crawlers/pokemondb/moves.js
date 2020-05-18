const _ = require('lodash');

const Helpers = require('@crawlers/helpers')
const tabSelector = '.tabset-moves-game > .tabs-tab-list a';

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
        const nextEl = $el.next()
        const hasWrapperTabs = $(nextEl).hasClass('tabs-wrapper')

        let anchor = null
        let tables = [{
          [anchor]: $(nextEl).find('table')
        }]

        if (hasWrapperTabs) {
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
      .reduce((tabmoves, { title, tables }) => {
        tabmoves[_.camelCase(title)] = Moves._tablesToMoves(
          cheerio, tables
        );

        return tabmoves;
      }, {});
  }

  static _tablesToMoves(cheerio, tables) {
    const $ = cheerio();
    const moves = []

    tables.forEach(item => {
      const [tableKey] = Object.keys(item)
      const table = item[tableKey]
      const current = $(table)
        .findArray('tbody tr')
        .map(tr => {
          const tds = $(tr).find('td');
          const hasSixTds = _.size(tds) === 6
          const base = hasSixTds ? 1 : 0
          const categorySpan = tds.eq(hasSixTds ? 3 : 2).find('span');
          
          if("Final Gambit" === tds.eq(base).text2()) {
            let x = 1
          }

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

  static _findTabContent(cheerio, tab) {
    const $ = cheerio();
    const $where = $($(tab).attr('href'));

    return $where
      .find('p').remove()
      .end().findArray('h3')
  }
}

module.exports = Moves;