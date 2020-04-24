const request = require('request-promise');
const cheerio = require('cheerio');
const _ = require('lodash');

const Helpers = require('../helpers');
const Pokedex = require('./pokedex');
const Defenses = require('./defenses');
const Sprites = require('./sprites');
const Moves = require('./moves');
const BaseStats = require('./basestats');

const Pokemon = require('../../models/pokemon');
const Card = require('../../models/card');

const baseUrl = {
  POKEMONDB: 'https://pokemondb.net',
  POKECRIES: 'https://pokemoncries.com',
  POKEZUKAN: 'https://zukan.pokemon.co.jp'
}

/**
 * 
 *
 * @class PokemonDB
 */
class PokemonDB {

  /**
   * Creates an instance of PokemonDB.
   * @memberof PokemonDB
   */
  constructor() {
    this.details = name => `${baseUrl.POKEMONDB}/pokedex/${name}`;
    this.pokeCries = `${baseUrl.POKECRIES}/cries`
    this.pokeZukanImgs = `${baseUrl.POKEZUKAN}/zukan-api/api/search/?limit=1055&page=1`
    this.zukanImgs = []
    this.tabSelector = '#dex-basics + .tabset-basics > .tabs-tab-list';
  }

  /**
   * 
   *
   * @param {string} pokename
   * @returns
   * @memberof PokemonDB
   */
  async getPokemon(pokename) {
    let pokemon = await Pokemon
      .findOne({
        'dexdata.name': pokename
      });

    if (_.some(pokemon)) {
      return this._addBorderData(pokemon.toJSON());
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
    // Check if any item exists inside db   
    if (!await Card.exists({})) {
      const cheerio = await this._getParsedHtml(
        `${baseUrl.POKEMONDB}/pokedex/national`
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
            sprite: `${baseUrl.POKECRIES}/pokemon-images/${+code}.png`,
            name: $el.find('.ent-name').text2(),
            types: a.toArray().map(link => $(link).text2())
          };
        });

      await Card
        .insertMany(allcards)
    }

    return await Card.getPaginatedCards(page, limit)
  }

  async getFilteredCards(searchTerm, limit) {
    if (!await Card.exists({})) {
      await this._getAllCards()
    }

    return await Card.getMatchCards(searchTerm, limit)
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
        borderUrl: `${baseUrl.POKEMONDB}${$el.attr('href')}`
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
      sprites: await Sprites.getSpritesFor(`${baseUrl.POKEMONDB}${$('.list-focus li a').attr('href')}`)
    }, {
      moves: Moves.getMoves(cheerio)
    }, {
      cries: this._getPokeCry(pokedex.nationalId)
    });

    await Pokemon.saveIfNotExits(pokemon);

    if (initBorders) {
      await this._addBorderData(pokemon)
    }

    return pokemon;
  }

  async _getAllCards() {
    const model = new Card()
    const cheerio = await this._getParsedHtml(
      `${baseUrl.POKEMONDB}/pokedex/national`
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
          sprite: `${baseUrl.POKECRIES}/pokemon-images/${+code}.png`,
          name: $el.find('.ent-name').text2(),
          types: a.toArray().map(link => $(link).text2())
        };
      });

    await model.save(allcards)
  }

  async _getParsedHtml(url) {
    return await request({
      url: url,
      method: 'GET',
      transform: html => {
        const $ = Helpers
          .loadPlugins(cheerio.load(html));

        return () => $;
      }
    });
  }

  async _addBorderData(pokemon) {
    const { border } = pokemon
    const { next, prev } = border
    const [nextBorder, prevBorder] = await Promise.all([
      this._getPokemonAtBorders(border.next),
      this._getPokemonAtBorders(border.prev),
    ])

    if (_.some(next)) {
      Object.assign(pokemon.border.next, { pokemon: nextBorder })
    }

    if (_.some(prev)) {
      Object.assign(pokemon.border.prev, { pokemon: prevBorder })
    }

    return pokemon
  }

  async _getPokemonAtBorders({ name, nationalId, borderUrl } = {}) {
    if (_.isEmpty(name) && _.isEmpty(nationalId)) return {}

    let pokemon = await Pokemon.findOne({
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
      pokedb: pokeImg,
      zucan: await this._resolveAllPngs(pokeid)
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
              link: `${baseUrl.POKEMONDB}${$a.attr('href')}`,
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