const _ = require('lodash');

const Helpers = require('@crawlers/helpers')
const tabSelector = '.tabset-moves-game > .tabs-tab-list a';

/**
 * Get all moves from the pokemon.
 *
 * @class Moves
 */
class Moves {

  /**
   * Get all moves from the move section.
   *
   * @static
   * @public
   * @param {Function} cheerio Function with page as `Cheerio` library reference.
   * @returns {any} All pokemon moves.
   * @memberof Moves
   */
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

  /**
   * Parse all content from the given tab
   *
   * @static
   * @private
   * @param {Function} cheerio Function with page as `Cheerio` library reference.
   * @param {CheerioSelector} tab Tab with all moves to be parsed.
   * @returns {any} All pokemon moves.
   * @memberof Moves
   */
  static _getAllMovesFromTab(cheerio, tab) {
    const $ = cheerio()
    const $content = Moves._findTabContent(cheerio, tab)
    const moveTables = $content
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

    return Moves._createTabMoves(cheerio, moveTables)
  }

  /**
   * Create the object representation from the given tables.
   * 
   * @static
   * @private
   * @param {Function} cheerio Function with page as `Cheerio` library reference.
   * @param {{title: String, tables: CheerioElement[]}[]} moveTables List of tables
   * found on the document with pokemon moves.
   * @returns {any} All pokemon moves.
   * @memberof Moves
   */
  static _createTabMoves(cheerio, moveTables) {
    return moveTables
      .reduce((moves, { title, tables }) => {
        moves[_.camelCase(title)] = Moves._tablesToMoves(
          cheerio, tables
        );

        return moves;
      }, {});
  }

  /**
   * Run over all table rows <tr> parsing each element as an move object.
   *
   * @static
   * @private
   * @param {Function} cheerio Function with page as `Cheerio` library reference.
   * @param {CheerioElement[]} tables Tables with all moves from that current pokemon.
   * @returns {{
   *  referenceTo: String,
   *  move: String,
   *  type: String,
   *  category: {
   *    img: String,
   *    title: String
   *  },
   *  power: String,
   *  accuracy: String
   * }[]} All pokemon moves.
   * @memberof Moves
   */
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

  /**
   * Search on document (inside `cheerio` function) for the content of *tab*.
   *
   * @static
   * @private
   * @param {Function} cheerio Function with page as `Cheerio` library reference.
   * @param {CheerioElement} tab Tab reference.
   * @returns {CheerioElement[]} All tab content.
   * @memberof Moves
   */
  static _findTabContent(cheerio, tab) {
    const $ = cheerio();
    const $where = $($(tab).attr('href'));

    return $where
      .find('p').remove()
      .end().findArray('h3')
  }
}

module.exports = Moves;