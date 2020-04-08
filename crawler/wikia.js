const request = require('request-promise'),
  cheerio = require('cheerio'),
  iconv = require('iconv-lite'),
  builder = require('./selectors'),
  sizeOf = require('image-size'),
  _ = require('lodash');

class Wikia {

  constructor() {
    this.urls = {
      base: 'http://pokemon.wikia.com/wiki',
      details: name => `${this.urls.base}/${name}`,
      sprite: nIndex => `https://sprites.pokecheck.org/i/${nIndex}.gif`,
      audio: {
        old: nindex => `https://pokemoncries.com/cries-old/${nindex}.mp3`,
        newGen: nindex => `https://pokemoncries.com/cries/${nindex}.mp3`
      }
    }
  }

  async get

  async getAllPokemonInfo(name) {
    const $ = await this.getPage(name),
      selectors = builder($);

    const {
      childTr: { second, third },
      mainTrs: { first },
      nIndex
    } = selectors;

    let pokemon = {
      name: $(first).find("b").eq(0).text(),
      img: $(first).find("tr").eq(2).find("img").attr('data-src'),
      japanese: selectors.jp,
      nIndex: nIndex,
      abilities: second.eq(3).find("td > a").map((idx, el) => $(el).text()).toArray(),
      category: second.eq(2).find("td").text().trim(),
      types: this.getTypes(second, $),
      evolvesFrom: second.eq(10).find("td").text().trim(),
      evolvesInto: second.eq(11).find("td").text().trim(),
      genderRatio: selectors.genders,
      weight: selectors.weight,
      heigth: selectors.heigth,
      dexColor: third.eq(5).find("td").eq(0).text().trim(),
      eggGroups: this.getEggGroup(third, $),
      shape: third.eq(7).find("td").eq(0).find('img').attr('data-src'),
      footprint: third.eq(7).find("td").eq(1).find("img").attr('data-src'),
      cry: this.getCryUrl(nIndex),
      locations: this.getLocations($),
      stats: this.getStats($),
      sprite: await this.getSpriteMeta(nIndex)
    }

    return pokemon;
  }

  async getPage(name) {
    const { urls: { details } } = this;

    return request(details(name), {
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
    return $("#mw-content-text > table").eq(4).find("tbody").map((idx, tbody) => {
      let $tbody = $(tbody);

      return {
        hp: +$tbody.find("td").eq(1).text(),
        attack: +$tbody.find("td").eq(3).text(),
        defense: +$tbody.find("td").eq(5).text(),
        spAtt: +$tbody.find("td").eq(7).text(),
        spDef: +$tbody.find("td").eq(9).text(),
        speed: +$tbody.find("td").eq(11).text(),
        total: +$tbody.find("td").eq(13).text(),
      }
    }).toArray()
  }

  getLocations($) {
    return $("#mw-content-text > table").eq(1).find("tr[style]").map((idx, tr) => {
      let $tr = $(tr);
      let $td = $tr.find("td")

      return {
        versions: $td.eq(0).find("span").map((idx, span) => $(span).text()).toArray(),
        areas: $td.eq(1).text().trim(),
        rarity: $td.eq(2).text().trim()
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
      .find('a').map((idx, el) => {
        return {
          description: $(el).text(),
          link: `${urls.base}${$(el).attr('href')}`
        }
      }).toArray()
  }

  getTypes($tr, $) {
    return $tr.eq(1).find("a").map((idx, el) =>
      _.first($(el).attr('title').split(" "))
    ).toArray()
  }
}

module.exports = new Wikia;