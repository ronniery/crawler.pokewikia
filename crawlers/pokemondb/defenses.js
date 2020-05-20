const _ = require('lodash');

/**
 * Get all pokemon defenses.
 * 
 * @class Defenses
 */
class Defenses {

  /**
   * Parse all typed defenses for the given anchor.
   *
   * @static
   * @public
   * @param {Function} cheerio Function with page as `Cheerio` library reference.
   * @param {String} anchor Element reference to extract the typed defenses.
   * @returns {any[]} List of parsed defenses.
   * @memberof Defenses
   */
  static getTypeDefenses(cheerio, anchor) {
    const tables = Defenses._getDefenseListToParse(cheerio, anchor);
    const content = Defenses._tablesToDefenses(cheerio, tables);
    return content;
  }

  /**
   * Prepare the structure to be parsed for the crawler, because the defenses
   * are structure with two tables, first table is the heading and the second
   * table is the table that contain all defense data and there is some tables
   * for specific abilities. So that function will order the structure, 
   * something like that `[ability, [table, table]]`. 
   * 
   * @static
   * @private
   * @param  {Function} cheerio Function with page as `Cheerio` library reference.
   * @param  {String} anchor Element reference to extract the typed defenses.
   * @return {[String, [CheerioElement, CheerioElement]]} {[ability, [description, effect]]}
   * The list of defenses to be parsed.
   * @memberof Defenses
   */
  static _getDefenseListToParse(cheerio, anchor) {
    const $ = cheerio();
    const anchorHref = $(anchor).attr('href')
    const $anchor = $(anchorHref);
    const $typecol = $anchor.find('.tabset-typedefcol');
    let tables = [
      [null, ..._.chunk($anchor.find('.type-table-pokedex'), 2)]
    ];

    if (_.some($typecol)) {
      tables = $typecol
        .findArray('a.tabs-tab')
        .map(a => {
          const property = $(a).text().replace(' ability', '');
          const subTable = $($(a).attr('href')).findArray('table');
          return [_.camelCase(property), subTable];
        });
    }

    return tables;
  }

  /**
   * Convert the tables to a list of defenses. 
   *  
   * @static
   * @private
   * @param  {Function} cheerio Function with page as `Cheerio` library reference.
   * @param  {CheerioElement[]} tables Table collection with all pokemon defenses.
   * @return {{[title: String]: String[], ability: String}[]} List of parsed defenses.
   * @memberof Defenses
   */
  static _tablesToDefenses(cheerio, tables) {
    const $ = cheerio();

    return tables
      .map(([ability, [description, effect]]) => {
        const defense = {};
        const links = $(description).find('tr')
          .first().findArray('a');
        const tds = $(effect).find('tr')
          .last().findArray('td');

        links.forEach((a, idx) => {
          const title = $(a).attr('title');
          const value = $(tds[idx]).attr('title');
          defense[_.camelCase(title)] = value.split(/\s[→|=]\s/g);
        });

        defense.ability = ability;
        return defense;
      });
  }
}

module.exports = Defenses;