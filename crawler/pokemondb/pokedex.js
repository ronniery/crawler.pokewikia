const _ = require('lodash')

const Helpers = require('../helpers')

class Pokedex {
  static getPokedex(cheerio, anchor) {
    const $ = cheerio()
    const [{ table }] = Helpers.searchTableOnDocument(cheerio, { name: "Pokédex data", anchor })
    const $table = $(table)

    return $table
      .findArray('tr')
      .reduce((reducer, tr) => {
        return this._trToPokedex($, reducer, tr)
      }, { name: $(anchor).text() })
  }

  static _trToPokedex($, reducer, tr) {
    const $tr = $(tr)
    const value = $tr.find('td').text2()
    const property = _.camelCase($tr.find('th').text2())

    // TODO: SPLIT THAT INTO METHODS
    if (property === 'local№') {
      const parts = value.split(/(\d{3})\s(\(.*?\))/g)
      const chunks = _.chunk(_.compact(parts), 2)

      reducer['localizations'] = chunks
        .map(([route, game]) => ({
          route, game
        }))
    } else if (property === 'abilities') {
      reducer['abilities'] = $tr.findArray('a')
        .map(el => $(el).text2())
    } else {
      reducer[property.replace('№', 'Id')] = value
    }

    return reducer
  }
}

module.exports = Pokedex