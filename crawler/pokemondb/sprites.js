const request = require('request-promise')
const cheerio = require('cheerio')
const Helpers = require('../helpers')

class Sprites {
  
  static getSpritesFor(pokename) {
    const spriteUrl = Sprites.#fullUrl(pokename)
    const $ = await Sprites.#getParsedHtml(spriteUrl)
    return Sprites.#parse($)
  }

  static async #getParsedHtml(url) {
    return request({
      url: url,
      method: 'GET',
      transform: html => {
        return Helpers.loadCheerioPlugins(cheerio.load(html))
      }
    })
  }

  static #fullUrl(pokename) {
    return `https://pokemondb.net/sprites/${pokename.toLowerCase()}`
  }

  static #parse($) {
    $('p').remove()

    return $('h2')
      .toArray()
      .map(h2 => {
        const table = $(h2).find('+ div > table')
        const allHeads = $(table).findArray('thead th')
        const usableHeads = allHeads.slice(1, allHeads.length)
        const allTrs = $(table).findArray('tbody tr')

        return {
          section: $(h2).text2(),
          table: Sprites.#parseAllSpriteTables(usableHeads, allTrs)
        }
      })
  }

  static #parseAllSpriteTables(usableHeads, allTs) {
    return usableHeads.map((head, idx) => {
      const data = {
        name: $(head).text(),
        rows: allTs.map(tr => {
          const allTds = $(tr).findArray('td')

          // Check if need $(allTds)
          const $td = $($(allTds).eq(idx + 1))

          return Sprites.#parseTableRow(
            allTds,
            $td.findArray('> span'),
            $td.findArray('> a')
          )
        })
      }

      return data
    })
  }

  static #parseTableRow(allTds, childSpans, childAs) {
    const htmlContent = $(_.first(allTds)).html()
    const getImgSrc = el => $(el).find('img').attr('src')
    const captionParts = htmlContent.replace(/\n+/g, '')
      .split(/<[^>]*>/g)

    const data = {
      captions: _.compact(captionParts),
      images: []
    }

    if (_.some(childSpans)) {
      data.images = childSpans.map(span =>
        ({
          text: $(span).text(),
          image: getImgSrc(span)
        })
      )
    } else if (_.some(childAs)) {
      data.images = childAs.map(a =>
        ({
          image: getImgSrc(a)
        })
      )
    } else {
      data.images = {
        text: '-'
      }
    }

    return data
  }
}

module.exports = Sprites