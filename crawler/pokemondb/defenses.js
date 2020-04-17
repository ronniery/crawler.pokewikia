const _ = require('lodash')

class Defenses {
  static getDefenses(cheerio, anchor) {
    // TODO: refactor
    const $ = cheerio()
    const $anchor = $(anchor).attr('href').toCheerio()
    const $typecol = $anchor.find('.tabset-typedefcol')
    let tables = [
      [null, ..._.chunk($anchor.find('.type-table-pokedex'), 2)]
    ]

    if (_.some($typecol)) {
      tables = $typecol
        .findArray('a.tabs-tab')
        .map(a => {
          const property = $(a).text().replace(' ability', '')
          const subTable = $($(a).attr('href')).findArray('table')
          return [_.camelCase(property), subTable]
        })
    }

    return Defenses._tableToDefenses(cheerio, tables)
  }

  static _tableToDefenses(cheerio, tables) {
    const $ = cheerio()

    //TODO: refactor
    return tables
      .map(([ability, [desc, effect]]) => {
        const defense = {}
        const findOn = (target, selector) => {
          const container = $(target).find(selector)
          return container.first()
            .find('a').toArray()
        }
        const links = $(desc).find('tr')
          .first().findArray('a');
        const tds = $(effect).find('tr')
          .last().findArray('td');

        links.forEach((a, idx) => {
          const title = $(a).attr('title')
          const value = $(tds[idx]).attr('title')
          defense[_.camelCase(title)] = value.split(/\s[→|=]\s/g)
        })

        defense['ability'] = ability
        return defense
      })
  }
}

module.exports = Defenses