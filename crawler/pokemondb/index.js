const request = require('request-promise');
const cheerio = require('cheerio');
const _ = require('lodash')

const Helpers = require('../helpers')
const Pokedex = require('./pokedex')
const Defenses = require('./defenses')

// var getTable = (name, anchor = null) => {
//   const $anchor = _.some(anchor) ? $($(anchor).attr('href')) : $(document)
//   const allEls = $anchor.find('*').toArray()
//   const currentH2 = $anchor.find('h2').toArray().find(h2 => $(h2).text().trim() === name)
//   const position = allEls.indexOf(currentH2)
//   const tables = []
//   let currentTable = {}

//   for (const el of allEls.slice(position + 1, allEls.length)) {
//     const withoutHead = _.isEmpty(currentTable)
//     const $el = $(el)

//     if ($el.is('h3') && withoutHead) {
//       currentTable.title = $(el).text()
//     } else if ($el.is('table')) {
//       currentTable.table = $el
//       tables.push(currentTable)
//       currentTable = {}
//     } else if ($el.is('h2')) {
//       break;
//     }
//   }

//   return tables
// }

// /* TODO */
// var getPokedex = anchor => {
//   const [{
//     table
//   }] = getTable("Pokédex data", anchor)
//   const $table = $(table)
//   return $table.find('tr').toArray().reduce((prev, tr) => {
//     const $tr = $(tr)
//     const value = getText($tr.find('td'))
//     const property = _.camelCase(getText($tr.find('th')))


//     if (property === 'local№') {
//       const parts = value.split(/(\d{3})\s(\(.*?\))/g)
//       const chunks = _.chunk(_.compact(parts), 2)

//       prev['localizations'] = chunks.map(([route, game]) => ({
//         route,
//         game
//       }))
//     } else if (property === 'abilities') {
//       prev['abilities'] = $tr.find('a').toArray().map(el => $(el).text())
//     } else {
//       prev[property.replace('№', 'Id')] = value
//     }

//     return prev
//   }, {
//     name: $(anchor).text()
//   })
// }

// /* OK */


// /* OK */
// var getTraining = () => {
//   const [{
//     table
//   }] = getTable("Training")
//   const $table = $(table)
//   const tds = $table.find('td')

//   return {
//     evYield: getPropertyWithMeta(tds.eq('0')),
//     catchRate: getPropertyWithMeta(tds.eq('1')),
//     baseFriendship: getPropertyWithMeta(tds.eq('2')),
//     baseExp: getPropertyWithMeta(tds.eq('3')),
//     growthRate: getPropertyWithMeta(tds.eq('4')),
//   }
// }

// /* OK */
// var getBaseStats = anchor => {
//   const [{
//     table
//   }] = getTable("Base stats", anchor)
//   const $table = $(table)

//   return $table.find('tr').toArray().reduce((prev, tr) => {
//     const $tr = $(tr)

//     prev[_.camelCase(getText($tr.find('th').eq(0)))] = {
//       base: getText($tr.find('td').eq(0)),
//       max: getText($tr.find('td').eq(2)),
//       min: getText($tr.find('td').eq(3))
//     }

//     return prev
//   }, {})
// }

// /* OK */


// /* OK */


// /* OK */
// var getFooterTable = tableTitle => {
//   const [{
//     table
//   }] = getTable(tableTitle)

//   return $(table).find('tr').toArray().reduce((prev, tr) => {
//     const $tr = $(tr)

//     prev[_.camelCase(getText($tr.find('th')))] = {
//       text: getText($tr.find('td')),
//       links: $tr.find('td a').toArray().map(a => {
//         return {
//           link: `https://pokemondb.net${$(a).attr('href')}`,
//           text: $(a).text()
//         }
//       })
//     }

//     return prev
//   }, {})
// }

// /* OK */
// var getNameOrigin = () => {
//   return _.chunk($('.etymology *'), 2).reduce((prev, [dt, dd]) => {
//     prev[_.camelCase($(dt).text())] = $(dd).text()
//     return prev
//   }, {})
// }

// /* OK */


// /* OK */

// /* OK */
// var getDerivations = anchor => {
//   return Object.assign({
//     baseStats: getBaseStats(anchor),
//     dexdata: getPokedex(anchor),
//     defenses: getTypeDefenses(anchor)
//   }, getPokeImg(anchor))
// }

// var getPokeImg = anchor => {
//   return {
//     pokeImg: $($(anchor).attr('href')).find('a[rel="lightbox"] img').attr('src')
//   }
// }

// var getPropertyWithMeta = el => {
//   const $el = $(el)
//   const $small = $el.find('small')
//   const data = {
//     text: getText($el.clone().find('small').remove().end())
//   }

//   if (_.some($small)) {
//     data.meta = getText($small)
//   }

//   return data
// }

// var getText = el => {
//   return $(el)
//     .text()
//     .trim()
//     .replace(/\n+/g, '')
// }

// var getPokemon = async (anchor = $("#dex-basics + .tabset-basics > .tabs-tab-list > a.active")) => {
//   const pokedex = getPokedex(anchor)

//   return Object.assign({
//     derivations: $("#dex-basics + .tabset-basics > .tabs-tab-list > a:not(.active)").toArray().map(el => getDerivations(el)),
//     pokeCry: `https://pokemoncries.com/cries-old/${pokedex.nationalId}.mp3`
//   }, {
//     dexdata: pokedex
//   }, {
//     breeding: getBreeding()
//   }, {
//     training: getTraining()
//   }, {
//     basestats: getBaseStats(anchor)
//   }, {
//     evochart: getEvoChart()
//   }, {
//     dexentries: getPokedexEntries()
//   }, {
//     whereFind: getFooterTable(`Where to find ${$('main > h1').text()}`)
//   }, {
//     otherLangs: getFooterTable("Other languages")
//   }, {
//     nameOrigin: getNameOrigin()
//   }, {
//     defenses: getTypeDefenses(anchor)
//   }, {
//     sprites: await getSprites()
//   })
// }

const BASE_URL = path => `https://pokemondb.net/pokedex/${path}`

class PokemonDB {

  constructor() {
    this.urls = {
      base: 'https://pokemondb.net/pokedex',
      pokedex: 'https://pokemondb.net/pokedex/national',
      details: name => `${this.urls.base}/${name}`,
      sprite: nIndex => `https://sprites.pokecheck.org/i/${nIndex}.gif`,
      audio: {
        old: nindex => `https://pokemoncries.com/cries-old/${nindex}.mp3`,
        newGen: nindex => `https://pokemoncries.com/cries/${nindex}.mp3`
      }
    }

    this.tabSelector = '#dex-basics + .tabset-basics > .tabs-tab-list'
  }

  async getPokemon(pokename) {
    const { urls: { details } } = this
    const cheerio = await this._getParsedHtml(details(pokename))
    const $ = cheerio()
    const notActiveTab = $(`${this.tabSelector} > a`).not('.active')
    const pokedex = Pokedex.getPokedex(cheerio, $(`${this.tabSelector} > a.active`))

    const pokemon = Object.assign({
      derivations: notActiveTab.toArray().map(el => this._getDerivations(cheerio, el)),
      pokeCry: `https://pokemoncries.com/cries-old/${pokedex.nationalId}.mp3`
    }, {
      dexdata: pokedex
    }, {
      breeding: this._getBreeding(cheerio)
    }, {
      baseStats: this._getBaseStats(cheerio, notActiveTab)
    }, {
      training: this._getTraining(cheerio)
    }, {
      //TODO : Bug daqui para baixo
      evochart: this._getEvoChart(cheerio)
    }, {
      dexentries: this._getPokedexEntries(cheerio)
    })

    return pokemon

    // }, {
    //   whereFind: getFooterTable(`Where to find ${$('main > h1').text()}`)
    // }, {
    //   otherLangs: getFooterTable("Other languages")
    // }, {
    //   nameOrigin: getNameOrigin()
    // }, {
    //   defenses: getTypeDefenses(anchor)
    // }, {
    //   sprites: await getSprites()
    // })
  }

  async _getParsedHtml(url) {
    return await request({
      url: url,
      method: 'GET',
      transform: html => {
        const $ = Helpers
          .loadCheerioPlugins(cheerio.load(html))

        return () => $
      }
    })
  }

  _getBreeding(cheerio) {
    const $ = cheerio()
    const [{ table }] = Helpers.searchTableOnDocument(cheerio, { name: "Breeding" })
    const $table = $(table)
    const tds = $table.find('td')

    return {
      eggGroups: Helpers.getPropertyWithMeta(cheerio, tds.eq('0')),
      gender: Helpers.getPropertyWithMeta(cheerio, tds.eq('1')),
      eggCycles: Helpers.getPropertyWithMeta(cheerio, tds.eq('2'))
    }
  }

  _getDerivations(cheerio, anchor) {
    return Object.assign({
      baseStats: this._getBaseStats(cheerio, anchor),
      dexdata: Pokedex.getPokedex(cheerio, anchor),
      defenses: Defenses.getDefenses(cheerio, anchor)
    }, this._getPokeImg(cheerio, anchor))
  }

  _getPokeImg(cheerio, anchor) {
    const $ = cheerio()
    const anchorHref = $(anchor).attr('href')

    return {
      pokeImg: $(anchorHref).find('a[rel="lightbox"] img').attr('src')
    }
  }

  _getBaseStats(cheerio, anchor) {
    const $ = cheerio()
    const [{ table }] = Helpers.searchTableOnDocument(cheerio, { name: "Base stats", anchor })
    const $table = $(table)

    return $table
      .findArray('tr')
      .reduce((reducer, tr) => {
        const getByIndex = idx => $(tr).children().eq(idx).text2()
        const property = getByIndex(0)

        reducer[_.camelCase(property)] = {
          base: +getByIndex(1),
          max: +getByIndex(3),
          min: +getByIndex(4)
        }

        return reducer
      }, {})
  }

  _getTraining(cheerio) {
    const $ = cheerio()
    const [{ table }] = Helpers.searchTableOnDocument(cheerio, { name: "Training" })
    const $table = $(table)
    const tds = $table.find('td')

    return {
      evYield: Helpers.getPropertyWithMeta(cheerio, tds.eq('0')),
      catchRate: Helpers.getPropertyWithMeta(cheerio, tds.eq('1')),
      baseFriendship: Helpers.getPropertyWithMeta(cheerio, tds.eq('2')),
      baseExp: Helpers.getPropertyWithMeta(cheerio, tds.eq('3')),
      growthRate: Helpers.getPropertyWithMeta(cheerio, tds.eq('4')),
    }
  }

  _getEvoChart(cheerio) {
    const $ = cheerio()

    return $('.infocard-list-evo')
      .toArray()
      .map(listEvo => {
        const chunks = _.chunk($(listEvo).find('> *'), 2)

        return chunks.map(([card, evo]) => {
          const $data = $(card).find('.infocard-lg-data')
          const condition = $(evo).find('small').text2()

          return {
            img: $(card).find('img').attr('src'),
            globalId: $data.find('small').first().text2(),
            name: $data.find('a.ent-name').text2(),
            types: $data.find('small').last().findArray('a').map((_idx, a) => $(a).text2()),
            evolveCondition: _.isEmpty(condition) ? null : condition.replace(/[\(|\)]/g, '').split(/\W\s/)
          }
        })
      })
  }

  _getPokedexEntries(cheerio) {
    const tables = Helpers.searchTableOnDocument(cheerio, { name: "Pokédex entries" })
    const $ = cheerio()

    return tables
      .map(({ table, title }) => {
        const $table = $(table)
        const rawName = _.isEmpty(title) ? $('main > h1').text2() : title
        const pokename = _.camelCase(rawName)

        return $table
          .findArray('tr')
          .reduce((prev, tr) => {
            const $tr = $(tr)
            const $th = $tr.find('th')
            const property = _.camelCase($th.text2())
            const originalTitleParts = $th.html().split(/<[^>]*>/g)

            prev[pokename][property] = {
              text: $tr.find('td').text2(),
              originalTitle: _.compact(originalTitleParts)
            }

            return prev
          }, {
            [pokename]: {}
          })
      })
  }
}

(async () => {
  await new PokemonDB()
    .getPokemon("Rattata")
})()
// Load custom plugins on page after get it