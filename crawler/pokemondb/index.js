const request = require('request-promise');
const cheerio = require('cheerio');
const _ = require('lodash');

const Helpers = require('../helpers');
const Pokedex = require('./pokedex');
const Defenses = require('./defenses');
const Sprites = require('./sprites');
const Moves = require('./moves');
const Pokemon = require('../../models/pokemon');
const Card = require('../../models/card');

const POKEMONDB_BASE_URL = 'https://pokemondb.net'
const POKECRIES_BASE_URL = 'https://pokemoncries.com'
const POKEZUKAN_BASE_URL = 'https://zukan.pokemon.co.jp'

class PokemonDB {

  constructor() {
    this.model = new Pokemon();
    this.details = name => `${POKEMONDB_BASE_URL}/pokedex/${name}`;
    this.pokeCries = `${POKECRIES_BASE_URL}/cries`
    this.pokeZukanImgs = `${POKEZUKAN_BASE_URL}/zukan-api/api/search/?limit=1055&page=1`
    this.zukanImgs = []
    this.tabSelector = '#dex-basics + .tabset-basics > .tabs-tab-list';
  }

  async getPokemon(pokename) {
    let pokemon = await this.model
      .findOne({
        'dexdata.name': pokename
      });

    if (_.some(pokemon)) {
      return this._addBorderData(pokemon);
    }

    return this._createPokemon(pokename);
  }

  /**
   * Get all cards with given pagination configuration.
   *
   * @param {number} page Card page to be loaded.
   * @param {number} limit Limit of cards in current page.
   * @returns {Promise<Card>} Loaded cards on current page.
   * @memberof PokemonDataBase
   */
  async getPaginatedCards(page, limit) {
    const model = new Card()
    // Check if any item exists inside db
    const exists = await model.existsAny({})

    if (!exists) {
      const cheerio = await this._getParsedHtml(
        `${POKEMONDB_BASE_URL}/pokedex/national`
      );
      const $ = cheerio();
      const allcards = $('.infocard')
        .toArray()
        .map(el => {
          const $el = $(el);
          const a = $el.find('small:last-child a');
          const code = $el.find('small:first-child').text2().replace('#', '');

          return {
            internationalId: code,
            sprite: `${POKECRIES_BASE_URL}/pokemon-images/${+code}.png`,
            name: $el.find('.ent-name').text2(),
            types: a.toArray().map(link => $(link).text2())
          };
        });

      await model.save(allcards)
    }

    return await model.getPaginatedCards(page, limit)
  }

  /**
   *
   *
   * @param {*} searchTerm
   * @param {*} limit
   * @returns
   * @memberof PokemonDataBase
   */
  async getFilteredCards(searchTerm, limit) {
    const model = new Card()
    const exists = await model.existsAny({})

    if (!exists) {
      await this._getAllCards()
    }

    return await model.getMatchCards(searchTerm, limit)
  }

  //#region Private methods  

  async _createPokemon(pokename, { initBorders = true, borderUrl = null } = {}) {
    if (_.isEmpty(pokename)) return {}

    const asLowerCase = pokename.toLowerCase()
    const nameLower = (
      {
        'nidoran♀': 'nidoran-f',
        'nidoran♂': 'nidoran-m'
      }[asLowerCase] || asLowerCase
    )
      .replace(/\s+/g, '-')

    const { details } = this;
    const fullUrl = _.isEmpty(borderUrl) ? details(nameLower) : borderUrl;
    const cheerio = await this._getParsedHtml(fullUrl);
    const $ = cheerio();

    const allTabs = $(`${this.tabSelector} > a`).not('.active');
    const activeTab = $(`${this.tabSelector} > a.active`);
    const pokedex = Pokedex.getPokedex(cheerio, activeTab);
    const getBorder = (selector) => {
      const $el = $(selector).first()

      if (_.isEmpty($el)) return {}

      const fulltext = $el.text2()
      const [id, name, left] = fulltext.split(' ')

      return {
        fulltext,
        nationalId: +id.replace('#', ''),
        name: _.some(left) ? `${name} ${left}` : name,
        borderUrl: `${POKEMONDB_BASE_URL}${$el.attr('href')}`
      }
    }

    let pokemon = Object.assign({
      pokeImgs: await this._getPokeImg(cheerio, activeTab),
      derivations: await this._getDerivations(cheerio, allTabs),
      border: {
        next: getBorder('a[rel="next"]'),
        prev: getBorder('a[rel="prev"]')
      }
    }, {
      dexdata: pokedex
    }, {
      breeding: this._getBreeding(cheerio)
    }, {
      baseStats: this._getBaseStats(cheerio, activeTab)
    }, {
      training: this._getTraining(cheerio)
    }, {
      evochart: this._getEvoChart(cheerio)
    }, {
      dexentries: this._getPokedexEntries(cheerio)
    }, {
      whereFind: this._getFooterTable(cheerio, `Where to find ${$('main > h1').text()}`)
    }, {
      otherLangs: this._getFooterTable(cheerio, 'Other languages')
    }, {
      nameOrigin: this._getNameOrigin(cheerio)
    }, {
      defenses: Defenses.getTypeDefenses(cheerio, activeTab)
    }, {
      sprites: await Sprites.getSpritesFor(`${POKEMONDB_BASE_URL}${$('.list-focus li a').attr('href')}`)
    }, {
      moves: Moves.getMoves(cheerio)
    }, {
      cries: this._getPokeCry(pokedex.nationalId)
    });

    await this.model.saveIfNotExits(pokemon);

    if (initBorders) {
      await this._addBorderData(pokemon)
    }

    return pokemon;
  }

  async _getAllCards() {
    const model = new Card()
    const cheerio = await this._getParsedHtml(
      `${POKEMONDB_BASE_URL}/pokedex/national`
    );
    const $ = cheerio();
    const allcards = $('.infocard')
      .toArray()
      .map(el => {
        const $el = $(el);
        const a = $el.find('small:last-child a');
        const code = $el.find('small:first-child').text2().replace('#', '');

        return {
          internationalId: code,
          sprite: `${POKECRIES_BASE_URL}/pokemon-images/${+code}.png`,
          name: $el.find('.ent-name').text2(),
          types: a.toArray().map(link => $(link).text2())
        };
      });

    await model.save(allcards)
  }

  async _getParsedHtml(url) {
    try {
      return await request({
        url: url,
        method: 'GET',
        transform: html => {
          const $ = Helpers
            .loadPlugins(cheerio.load(html));

          return () => $;
        }
      });
    } catch (e) {
      console.log(e)
      return e
    }
  }

  async _addBorderData(pokemon) {
    const { border } = pokemon
    const [next, prev] = await Promise.all([
      this._getPokemonAtBorders(border.next),
      this._getPokemonAtBorders(border.prev),
    ])

    Object.assign(pokemon.border.next, { pokemon: next })
    Object.assign(pokemon.border.prev, { pokemon: prev })
    return pokemon
  }

  async _getPokemonAtBorders({ name, nationalId, borderUrl }) {
    const { model } = this;

    let pokemon = await model.findOne({
      $or: [
        { 'dexdata.name': name },
        { 'dexdata.nationalId': nationalId }
      ]
    })

    if (_.isEmpty(pokemon)) {
      pokemon = await this._createPokemon(name, {
        initBorders: false,
        borderUrl
      })
    }

    return pokemon
  }

  _getBreeding(cheerio) {
    const [{ table }] = Helpers.searchTableOnDocument(cheerio, {
      name: 'Breeding'
    });

    const $ = cheerio();
    const $table = $(table);
    const tds = $table.find('td');

    return {
      eggGroups: Helpers.getPropertyWithMeta(cheerio, tds.eq('0')),
      gender: Helpers.getPropertyWithMeta(cheerio, tds.eq('1')),
      eggCycles: Helpers.getPropertyWithMeta(cheerio, tds.eq('2'))
    };
  }

  async _getDerivations(cheerio, tabs) {
    const derivations = [];

    for (const tab of tabs.toArray()) {
      const processed = {};

      Object.assign(processed, {
        baseStats: this._getBaseStats(cheerio, tab),
        dexdata: Pokedex.getPokedex(cheerio, tab),
        defenses: Defenses.getTypeDefenses(cheerio, tab),
        pokeImgs: await this._getPokeImg(cheerio, tab)
      });

      derivations.push(processed);
    }

    return derivations;
  }

  async _getPokeImg(cheerioRef, anchor) {
    const $ = cheerioRef();
    const anchorHref = $(anchor).attr('href');
    const boxImg = $(anchorHref).find('a[rel="lightbox"] img');
    const pokeImg = boxImg.attr('src');
    const [, pokeid] = $(anchorHref).html().match(/<strong>(\d+)<\/strong>/)

    return {
      jpg: pokeImg,
      png: await this._resolveAllPngs(pokeid)
    };
  }

  async _resolveAllPngs(pokeid) {
    if (_.isEmpty(this.zukanImgs)) {
      await request(this.pokeZukanImgs, {
        method: 'GET',
        json: true,
        transform: ({ results }) => this.zukanImgs =
          _.groupBy(results, 'no')
      })
    }

    const found = this.zukanImgs[pokeid]
    return _.some(found) ? found : []
  }

  _getBaseStats(cheerio, anchor) {
    const foundEl = Helpers.searchTableOnDocument(cheerio, {
      name: 'Base stats',
      anchor
    });

    if (_.isEmpty(foundEl)) return {}

    const [{ table }] = foundEl
    const $ = cheerio();
    const $table = $(table);

    return $table
      .findArray('tr')
      .reduce((reducer, tr) => {
        const getByIndex = idx => $(tr).children().eq(idx).text2();
        const property = getByIndex(0);
        const propCamel = _.camelCase(property)

        reducer[propCamel] = {
          base: +getByIndex(1),
          max: +getByIndex(3),
          min: +getByIndex(4)
        };

        if (propCamel === "total") {
          delete reducer.max
          delete reducer.min
        }

        return reducer;
      }, {});
  }

  _getTraining(cheerio) {
    const [{ table }] = Helpers.searchTableOnDocument(cheerio, {
      name: 'Training'
    });

    const $ = cheerio();
    const $table = $(table);
    const tds = $table.find('td');

    return {
      evYield: Helpers.getPropertyWithMeta(cheerio, tds.eq('0')),
      catchRate: Helpers.getPropertyWithMeta(cheerio, tds.eq('1')),
      baseFriendship: Helpers.getPropertyWithMeta(cheerio, tds.eq('2')),
      baseExp: Helpers.getPropertyWithMeta(cheerio, tds.eq('3')),
      growthRate: Helpers.getPropertyWithMeta(cheerio, tds.eq('4')),
    };
  }

  _getEvoChart(cheerio) {
    const $ = cheerio();

    return $('.infocard-list-evo')
      .toArray()
      .map(listEvo => {
        const chunks = _.chunk($(listEvo).find('> *'), 2);

        return chunks
          .map(([card, evo]) => {
            const $data = $(card).find('.infocard-lg-data');
            const condition = $(evo).find('small').text2();
            const rawTypes = $data.find('small').last().findArray('a');

            return {
              img: $(card).find('.img-fixed').attr('data-src'),
              globalId: $data.find('small').first().text2(),
              name: $data.find('a.ent-name').text2(),
              types: rawTypes.map(a => $(a).text2()),
              evolveCondition: _.isEmpty(condition) ? null : condition.replace(/[(|)]/g, '').split(/\W\s/)
            };
          });
      });
  }

  _getPokedexEntries(cheerio) {
    const tables = Helpers.searchTableOnDocument(cheerio, { name: 'Pokédex entries' });
    const $ = cheerio();

    return tables
      .map(({ table, title }) => {
        const $table = $(table);
        const rawName = _.isEmpty(title) ? $('main > h1').text2() : title;
        const pokename = _.camelCase(rawName);

        return $table
          .findArray('tr')
          .reduce((reducer, tr) => {
            const $tr = $(tr);
            const $th = $tr.find('th');
            const property = _.camelCase($th.text2());
            const originalTitleParts = $th.html().split(/<[^>]*>/g);

            reducer[pokename][property] = {
              text: $tr.find('td').text2(),
              originalTitle: _.compact(originalTitleParts)
            };

            return reducer;
          }, {
            [pokename]: {}
          });
      });
  }

  _getFooterTable(cheerio, tableHeader) {
    const foundEl = Helpers.searchTableOnDocument(cheerio, { name: tableHeader });

    if (_.isEmpty(foundEl)) return {}

    const [{ table }] = foundEl
    const $ = cheerio();

    return $(table)
      .findArray('tr')
      .reduce((reducer, tr) => {
        const $tr = $(tr);
        const $th = $tr.find('th');
        const property = _.camelCase($th.text2());

        reducer[property] = {
          text: $tr.find('td').text2(),
          links: $tr.findArray('td a').map(a => {
            const $a = $(a);

            return {
              link: `${POKEMONDB_BASE_URL}${$a.attr('href')}`,
              text: $a.text2()
            };
          })
        };

        return reducer;
      }, {});
  }

  _getNameOrigin(cheerio) {
    const $ = cheerio();
    const $etymo = $('.etymology *');
    const chunks = _.chunk($etymo, 2);

    return chunks
      .reduce((reducer, [dt, dd]) => {
        const property = _.camelCase($(dt).text2());
        reducer[property] = $(dd).text2();

        return reducer;
      }, {});
  }

  _getPokeCry(nationalId) {
    const nindex = +nationalId;
    const cries = {
      newGen: `${this.pokeCries}/${nindex}.mp3`
    };

    if (nindex <= 649) {
      cries.old = `${this.pokeCries}-old/${nindex}.mp3`;
    }

    return cries;
  }

  //#region 
}

module.exports = new PokemonDB();