const _ = require('lodash')

class Helpers {
  static searchTableOnDocument(cheerio, { name, anchor = null }) {
    const allElements = Helpers._getElementsAheadTextMatch(cheerio, {
      name, anchor
    })
    const foundTable = []
    const $ = cheerio()

    let workTable = {}
    for (const el of allElements) {
      const withoutHead = _.isEmpty(workTable)
      const $el = $(el)

      if ($el.is('h3') && withoutHead) {
        workTable.title = $(el).text2()
      } else if ($el.is('table')) {
        workTable.table = $el
        foundTable.push(workTable)
        workTable = {}
      } else if ($el.is('h2')) {
        break;
      }
    }

    return foundTable
  }

  static getPropertyWithMeta(cheerio, el) {
    const $ = cheerio()
    const $el = $(el)
    const $small = $el.find('small')
    const data = {
      text: $el.find('small').remove()
        .end().text2()
    }

    if (_.some($small)) {
      data.meta = $small.text2()
    }

    return data
  }

  static loadCheerioPlugins($) {
    $.prototype.text2 = function () {
      return this
        .text()
        .trim()
        .replace(/\n+/g, '')
    }

    $.prototype.findArray = function (selector) {
      return this.find(selector).toArray()
    }

    return $
  }

  static _getElementsAheadTextMatch(cheerio, { name, anchor }) {
    const $ = cheerio()
    const getElements = (target, selector) => {
      return _.some(target.cheerio) ?
        target.findArray(selector) :
        target(selector).toArray()
    }

    const $anchor = _.some(anchor) ? $($(anchor).attr('href')) : $
    const childrens = getElements($anchor, '*')
    const h2Position = getElements($anchor, 'h2')
      .findIndex(h2 => $(h2).text2() === name)

    return childrens.slice(h2Position + 1, childrens.length)
  }
}

module.exports = Helpers