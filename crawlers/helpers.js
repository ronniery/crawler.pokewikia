const _ = require('lodash');
const Entities = require('html-entities').AllHtmlEntities;
const decoder = new Entities()

/**
 * Get the text of a cheerio element removing break lines (\n),
 * removing white spaces on left and right side and decoding 
 * the html entities with the lib `html-entities`.
 * 
 * @see Cheerio
 * @see html-entities
 * @returns {String} The decoded and cleaned text.
 */
const text2 = function () {
  const bruteText = this.text().trim()
    .replace(/\n+/g, '');

  return Helpers.decodeEntities(bruteText)
};

/**
 * Search the given selector on document and returns the result as an Array. 
 * 
 * @see Cheerio
 * @param {String} selector Base selector to search on `Cheerio` reference and 
 * return the result as an Array.
 * @returns {CheerioElement[]} Found elements as an Array.
 */
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
   * Search a table inside the document using the configuration provided in `args`.
   *
   * @static
   * @public
   * @param {{h2Header: String, anchor: CheerioElement}} args Configuration to be used 
   * on search process. The function will try will search the table that matches 
   * with given table header and if provided use anchor to search the table inside 
   * of it.
   * @returns {{title: String, table: HTMLElement}}
   * @memberof Helpers
   */
  static searchTableOnDocument(...args) {
    const allElements = Helpers._getElementsAheadOfTextMatch(...args);
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

  /**
   * Convert the `el` element as a object with text and meta.
   *
   * @static
   * @public
   * @param {Function} cheerio Function with page as `Cheerio` library reference.
   * @param {CheerioElement} el Element to parse as a property with metadata.
   * @returns {{text: String, meta?: String}} Returns an object with text and a meta property is it exists.
   * @memberof Helpers
   */
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

  /**
   * Load the predefined plugins on the `Cheerio` instance.
   *
   * @static
   * @public
   * @param {Cheerio} $ Cheerio instance to inject the plugins.
   * @returns {Cheerio} Instance with loaded plugins.
   * @memberof Helpers
   */
  static loadPlugins($) {
    $.prototype.text2 = text2
    $.prototype.findArray = findArray
    return $;
  }

  /**
   * Decode the HTML entities.
   *
   * @static
   * @public
   * @param {String} text Text do be decoded.
   * @returns {String} Decoded text.
   * @memberof Helpers
   */
  static decodeEntities(text) {
    return decoder.decode(text)
  }

  /**
   * Get the image `src` or `data-src`.
   *
   * @static
   * @public
   * @param {CheerioStatic} $ Cheerio reference with page content.
   * @param {CheerioElement} el Element to search for image source.
   * @returns {String} Found image source.
   * @memberof Helpers
   */
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

  /**
   * Using the know *h2Header* position, the function will get and return
   * all elements after that position.
   *
   * @static
   * @private
   * @param {Function} cheerio Function with page as `Cheerio` library reference.
   * @param {{h2Header: String, anchor: CheerioElement}} { h2Header, anchor } The *h2Header*
   * to search on document and the anchor to be the used instead of entire document.
   * @returns {CheerioElement[]} All elements ahead of the *h2Header*.
   * @memberof Helpers
   */
  static _getElementsAheadOfTextMatch(cheerio, { h2Header, anchor }) {
    require('fs').writeFileSync('./h.html', cheerio().html())
    const elements = Helpers._getElementsFrom(cheerio, anchor);
    const h2Position = Helpers._findHeadPosition(cheerio, elements, h2Header);
    return elements.slice(h2Position + 1, elements.length) || [{}];
  }

  /**
   * Search which is the index position from *h2Header*. 
   *
   * @static
   * @private
   * @param {Function} cheerio Function with page as `Cheerio` library reference.
   * @param {CheerioElement[]} elements Element list to search the h2 position.
   * @param {String} h2Header The string content from the <h2> element.
   * @returns {Number} The <h2> index position on document.
   * @memberof Helpers
   */
  static _findHeadPosition(cheerio, elements, h2Header) {
    const $ = cheerio();

    return $(elements)
      .toArray()
      .findIndex(child => {
        return child.tagName === 'h2' &&
          new RegExp(h2Header).test($(child).text2());
      });
  }

  /**
   * Get all elements from `anchor` if is provided or use the `*` instead.
   *
   * @static
   * @private
   * @param {Function} cheerio Function with page as `Cheerio` library reference.
   * @param {CheerioElement} anchor Element to use as reference to searching process.
   * @returns {CheerioElement[]} All elements found inside anchor or `*` selector.
   * @memberof Helpers
   */
  static _getElementsFrom(cheerio, anchor = null) {
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