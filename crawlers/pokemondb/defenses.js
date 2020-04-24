const _ = require('lodash');

/**
 * 
 * 
 * @class Defenses
 */
class Defenses {
  static getTypeDefenses(cheerio, anchor) {
    const tables = Defenses._getTablesToParse(cheerio, anchor);
    const content = Defenses._tableToDefenses(cheerio, tables);
    return content;
  }

  /**
   * 
   * @static
   * @param  {any} cheerio 
   * @param  {any} anchor 
   * @return 
   * @memberof Defenses
   */
  static _getTablesToParse(cheerio, anchor) {
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
   * 
   * @static
   * @param  {any} cheerio 
   * @param  {any} tables 
   * @return 
   * @memberof Defenses
   */
  static _tableToDefenses(cheerio, tables) {
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