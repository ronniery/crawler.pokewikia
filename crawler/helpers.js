const _ = require('lodash');

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

      if (el.tagName === 'h3' && withoutHead) {
        workTable.title = $(el).text2();
      } else if (el.tagName === 'table') {
        workTable.table = $(el);
        foundTable.push(workTable);
        workTable = {};
      } else if (el.tagName === 'h2') {
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
    $.prototype.text2 = function () {
      return this
        .text()
        .trim()
        .replace(/\n+/g, '');
    };

    $.prototype.findArray = function (selector) {
      return this.find(selector).toArray();
    };

    return $;
  }

  static _getElementsAheadTextMatch(cheerio, { name, anchor }) {
    const $ = cheerio();
    const getElements = selector => {
      let els = $(selector)
        .toArray();

      if (_.some(anchor)) {
        els = $($(anchor).attr('href'))
          .findArray(selector);
      }

      return els;
    };

    const childrens = getElements('*');
    const h2Position = $(childrens).toArray()
      .findIndex(child => {
        return child.tagName === 'h2' &&
          new RegExp(name).test($(child).text2());
      });

    return childrens.slice(h2Position + 1, childrens.length) || [{}];
  }
}

module.exports = Helpers;