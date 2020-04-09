const request = require('request-promise'),
  cheerio = require('cheerio'),
  iconv = require('iconv-lite'),
  builder = require('./selectors'),
  sizeOf = require('image-size'),
  redis = require('memory-cache'),
  _ = require('lodash');

const maxCacheTime = 60 * 60000 // 60 minutes

class Wikia {

  constructor() {
    this.urls = {
      base: 'http://pokemon.wikia.com/wiki',
      pokedex: 'https://pokemondb.net/pokedex/national',
      details: name => `${this.urls.base}/${name}`,
      sprite: nIndex => `https://sprites.pokecheck.org/i/${nIndex}.gif`,
      audio: {
        old: nindex => `https://pokemoncries.com/cries-old/${nindex}.mp3`,
        newGen: nindex => `https://pokemoncries.com/cries/${nindex}.mp3`
      }
    }
  }

  async getAllCards() {
    let cards = redis.get('cards')

    if (!_.isEmpty(cards)) return cards

    const $ = await this.getPage(this.urls.pokedex)

    cards = $('.infocard')
      .toArray()
      .map(el => {
        const $el = $(el)
        const a = $el.find('small:last-child a')

        return {
          code: this.getText($el.find('small:first-child')),
          name: this.getText($el.find('.ent-name')),
          types: a.toArray().map(link => this.getText($(link)))
        }
      })

    redis.put('cards', cards, maxCacheTime)

    return cards
  }

  async getAllPokemonInfo(name) {
    let allPokemons = redis.get('pokemon') || []
    let pokemon = allPokemons.find(poke => poke.name === name)

    if (!_.isEmpty(pokemon)) return pokemon

    const { urls: { details } } = this;
    const $ = await this.getPage(details(name)),
      selectors = builder($);

    const {
      childTr: { second, third },
      mainTrs: { first },
      nIndex
    } = selectors;

    pokemon = {
      name: this.getText($(first).find("b").eq(0)),
      img: $(first).find("tr").eq(2).find("img").attr('data-src'),
      japanese: selectors.jp,
      nIndex: nIndex,
      abilities: second.eq(3).find("td > a").map((_idx, el) => this.getText($(el))).toArray(),
      category: this.getText(second.eq(2).find("td")),
      types: this.getTypes(second, $),
      evolvesFrom: this.getText(second.eq(10).find("td")),
      evolvesInto: this.getText(second.eq(11).find("td")),
      genderRatio: selectors.genders,
      weight: selectors.weight,
      heigth: selectors.heigth,
      dexColor: this.getText(third.eq(5).find("td").eq(0)),
      eggGroups: this.getEggGroup(third, $),
      shape: third.eq(7).find("td").eq(0).find('img').attr('data-src'),
      footprint: third.eq(7).find("td").eq(1).find("img").attr('data-src'),
      cry: this.getCryUrl(nIndex),
      locations: this.getLocations($),
      stats: this.getStats($),
      sprite: await this.getSpriteMeta(nIndex)
    }

    allPokemons.push(pokemon)
    redis.put('pokemons', allPokemons, maxCacheTime)

    return pokemon;
  }

  async getPage(url) {
    return request(url, {
      method: 'GET',
      headers: {
        'User-Agen': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36'
      },
      transform: html => {
        return cheerio.load(
          iconv.decode(Buffer.from(html), "utf-8")
        );
      }
    });
  }

  async getSpriteMeta(nIndex) {
    const spriteUrl = this.urls.sprite(nIndex);

    try {
      return request(spriteUrl, {
        method: 'GET',
        resolveWithFullResponse: true,
        transform: res => {
          return Object.assign({
            url: spriteUrl
          }, sizeOf(Buffer.from(res)));
        }
      })
    } catch (e) { console.err(e) }
  }

  getStats($) {
    return $("#mw-content-text > table")
      .eq(4)
      .find("tbody")
      .map((_idx, tbody) => {
        let $tbody = $(tbody);

        return {
          hp: +this.getText($tbody.find("td").eq(1)),
          attack: +this.getText($tbody.find("td").eq(3)),
          defense: +this.getText($tbody.find("td").eq(5)),
          spAtt: +this.getText($tbody.find("td").eq(7)),
          spDef: +this.getText($tbody.find("td").eq(9)),
          speed: +this.getText($tbody.find("td").eq(11)),
          total: +this.getText($tbody.find("td").eq(13)),
        }
      }).toArray()
  }

  getLocations($) {
    return $("#mw-content-text > table")
      .eq(1)
      .find("tr[style]")
      .map((_idx, tr) => {
        let $tr = $(tr);
        let $td = $tr.find("td")

        return {
          versions: $td.eq(0).find("span").map((_idx, span) => this.getText($(span))).toArray(),
          areas: this.getText($td.eq(1)),
          rarity: this.getText($td.eq(2))
        }
      }).toArray()
  }

  getCryUrl(nindex) {
    nindex = +nindex;

    const { old, newGen } = this.urls.audio;
    //Set old gen as default
    let url = old(nindex);

    if (nindex > 649) {
      url = newGen(nindex);
    }

    return url;
  }

  getEggGroup($tr, $) {
    const { urls } = this;

    return $tr.eq(5).find("td").eq(1)
      .find('a').map((_idx, el) => {
        return {
          description: this.getText($(el)),
          link: `${urls.base}${$(el).attr('href')}`
        }
      }).toArray()
  }

  getTypes($tr, $) {
    return $tr.eq(1).find("a").map((idx, el) =>
      _.first($(el).attr('title').split(" "))
    ).toArray()
  }

  getText($el) {
    return $el.text().trim()
  }
}

module.exports = new Wikia;