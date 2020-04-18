const request = require('request-promise');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');
const _ = require('lodash');

const Helpers = require('../helpers');
const Pokedex = require('./pokedex');
const Defenses = require('./defenses');
const Sprites = require('./sprites');
const Moves = require('./moves');

class PokemonDataBase {

  constructor() {
    this.details = name => `https://pokemondb.net/pokedex/${name}`;
    this.tabSelector = '#dex-basics + .tabset-basics > .tabs-tab-list';
    this.cache = new NodeCache({
      stdTTL: 60 * 60 * 0.5
    });
  }

  async getPokemon(pokename) {
    let pokemon = this.cache.get(pokename);

    if (_.some(pokemon)) {
      return pokemon;
    }

    return this._createPokemon(pokename);
  }

  async getAllCards() {
    const cheerio = await this._getParsedHtml(
      'https://pokemondb.net/pokedex/national'
    );
    const $ = cheerio();

    return $('.infocard')
      .toArray()
      .map(el => {
        const $el = $(el);
        const a = $el.find('small:last-child a');
        const name = $el.find('.ent-name').text2();

        return {
          code: $el.find('small:first-child').text2(),
          sprite: `https://img.pokemondb.net/artwork/large/${name.toLowerCase()}.jpg`,
          name,
          types: a.toArray().map(link => $(link).text2())
        };
      });
  }

  //#region Private methods  

  async _createPokemon(pokename) {
    const { details } = this;
    const detailsUrl = details(pokename);
    const cheerio = await this._getParsedHtml(detailsUrl);
    const $ = cheerio();

    const allTabs = $(`${this.tabSelector} > a`).not('.active');
    const pokedex = Pokedex.getPokedex(cheerio, $(`${this.tabSelector} > a.active`));

    let pokemon = Object.assign({
      derivations: allTabs
        .toArray().map(tab =>
          this._getDerivations(cheerio, tab)
        ),
    }, {
      dexdata: pokedex
    }, {
      breeding: this._getBreeding(cheerio)
    }, {
      baseStats: this._getBaseStats(cheerio, allTabs)
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
      defenses: Defenses.getDefenses(cheerio, allTabs)
    }, {
      sprites: await Sprites.getSpritesFor(pokename)
    }, {
      moves: Moves.getMoves(cheerio)
    }, {
      cries: this._getPokeCry(pokedex.nationalId)
    });

    this.cache.set(pokename, pokemon);
    return pokemon;
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

  _getDerivations(cheerio, anchor) {
    return Object.assign({
      baseStats: this._getBaseStats(cheerio, anchor),
      dexdata: Pokedex.getPokedex(cheerio, anchor),
      defenses: Defenses.getDefenses(cheerio, anchor)
    }, this._getPokeImg(cheerio, anchor));
  }

  _getPokeImg(cheerio, anchor) {
    const $ = cheerio();
    const anchorHref = $(anchor).attr('href');
    const boxImg = $(anchorHref).find('a[rel="lightbox"] img');

    return {
      pokeImg: boxImg.attr('src')
    };
  }

  _getBaseStats(cheerio, anchor) {
    const [{ table }] = Helpers.searchTableOnDocument(cheerio, {
      name: 'Base stats',
      anchor
    });

    const $ = cheerio();
    const $table = $(table);

    return $table
      .findArray('tr')
      .reduce((reducer, tr) => {
        const getByIndex = idx => $(tr).children().eq(idx).text2();
        const property = getByIndex(0);

        reducer[_.camelCase(property)] = {
          base: +getByIndex(1),
          max: +getByIndex(3),
          min: +getByIndex(4)
        };

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
    const [{ table }] = Helpers.searchTableOnDocument(cheerio, { name: tableHeader });
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
              link: `https://pokemondb.net${$a.attr('href')}`,
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
      newGen: `https://pokemoncries.com/cries/${nindex}.mp3`
    };

    if (nindex <= 649) {
      cries.old = `https://pokemoncries.com/cries-old/${nindex}.mp3`;
    }

    return cries;
  }

  //#region 
}

module.exports = PokemonDataBase;