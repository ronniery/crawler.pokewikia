const _ = require('lodash');
const Entities = require('html-entities').AllHtmlEntities;
const decoder = new Entities()

const text2 = function () {
  const bruteText = this.text().trim()
    .replace(/\n+/g, '');

  return Helpers.decodeEntities(bruteText)
};

const findArray = function (selector) {
  return this.find(selector).toArray();
}

/**
 * Helpers and utilities to be used on the crawlers.
 *
 * @class Helpers
 */
class Helpers {

  /**
   * 
   *
   * @static
   * @param {*} args
   * @returns {{title: string, table: HTMLElement}}
   * @memberof Helpers
   */
  static searchTableOnDocument(...args) {
    const allElements = Helpers._getElementsAheadTextMatch(...args);
    const foundTable = [];
    const $ = _.first(args)();

    let workTable = {};
    for (const el of allElements) {
      const withoutHead = _.isEmpty(workTable);
      const { tagName } = el

      if (tagName === 'h3' && withoutHead) {
        workTable.title = $(el).text2();
      } else if (tagName === 'table') {
        workTable.table = $(el);
        foundTable.push(workTable);
        workTable = {};
      } else if (tagName === 'h2') {
        break;
      }
    }

    return foundTable || [{}];
  }

  static getPropertyWithMeta(cheerio, el) {
    const $ = cheerio();
    const $el = $(el);
    const $small = $el.find('small');
    const data = {
      text: $el.find('small').remove()
        .end().text2()
    };

    if (_.some($small)) {
      data.meta = $small.text2();
    }

    return data;
  }

  static loadPlugins($) {
    $.prototype.text2 = text2
    $.prototype.findArray = findArray
    return $;
  }

  static decodeEntities(text) {
    return decoder.decode(text)
  }

  static getImgSrc($, el) {
    const dataSrc = $(el).attr('data-src')

    // Try get img from lazy loading
    if (_.some(dataSrc)) {
      return dataSrc;
    }

    // Fallback to default <img> tag
    return $(el).find('img')
      .attr('src')
  }

  static _getElementsAheadTextMatch(cheerio, { tableHeader, anchor }) {
    const elements = Helpers._getElementsFrom(cheerio, anchor);
    const h2Position = Helpers._findHeadPosition(cheerio, elements, tableHeader);
    return elements.slice(h2Position + 1, elements.length) || [{}];
  }

  static _findHeadPosition(cheerio, elements, textToMatch) {
    const $ = cheerio();

    return $(elements)
      .toArray()
      .findIndex(child => {
        return child.tagName === 'h2' &&
          new RegExp(textToMatch).test($(child).text2());
      });
  }

  static _getElementsFrom(cheerio, anchor) {
    const $ = cheerio();
    const selector = '*';

    let els = $(selector)
      .toArray();

    if (_.some(anchor)) {
      els = $($(anchor).attr('href'))
        .findArray(selector);
    }

    return els;
  }
}

module.exports = Helpers;