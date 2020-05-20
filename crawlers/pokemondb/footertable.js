const _ = require('lodash')

const Helpers = require('@crawlers/helpers')

/**
 * Generic way to get lists at the footer of the page using the 
 * header as a starter point.
 *
 * @class FooterTable
 */
class FooterTable {

  /**
   * Get all footer data as am object.
   *
   * @static
   * @public
   * @param {Function} cheerio Function with page as `Cheerio` library reference.
   * @param {String} h2Header Footer heading <h2>.
   * @param {String} baseUrl Base url to update the link href when needed.
   * @returns {any} Footer table as an object.
   * @memberof FooterTable
   */
  static getFooterTable(cheerio, h2Header, baseUrl) {
    const foundEl = Helpers.searchTableOnDocument(cheerio, { h2Header });

    if (_.isEmpty(foundEl)) return {}

    const [{ table }] = foundEl
    return FooterTable._tableToFooter(cheerio, table, baseUrl)
  }

  /**
   * Convert the table to a full footer object representation.
   *
   * @static
   * @private
   * @param {Function} cheerio Function with page as `Cheerio` library reference.
   * @param {CheerioElement} table Footer table to be parsed.
   * @param {String} baseUrl Base url to update the link href when needed.
   * @returns {any} Footer table as an object.
   * @memberof FooterTable
   */
  static _tableToFooter(cheerio, table, baseUrl) {
    const $ = cheerio();

    return $(table)
      .findArray('tr')
      .reduce((footer, tableRow) => {
        return FooterTable._injectFooter(
          cheerio, footer, tableRow, baseUrl
        )
      }, {});
  }

  /**
   * Create, parsing data from the given table row <tr> and inject the parsed data
   * on the provided footer `ref`. 
   *
   * @static
   * @private
   * @param {Function} cheerio Function with page as `Cheerio` library reference.
   * @param {Object} ref Footer reference to inject the parsed data inside it.
   * @param {CheerioElement} tableRow Table row <tr> with the footer data.
   * @param {String} baseUrl Base url to update the link href when needed.
   * @returns {any} The reducer reference with the created data from footer.
   * @memberof FooterTable
   */
  static _injectFooter(cheerio, ref, tableRow, baseUrl) {
    const $ = cheerio();
    const $tr = $(tableRow);
    const $th = $tr.find('th');
    const property = _.camelCase($th.text2());

    ref[property] = {
      text: $tr.find('td').text2(),
      links: $tr.findArray('td a').map(a => {
        const $a = $(a);

        return {
          link: `${baseUrl}${$a.attr('href')}`,
          text: $a.text2()
        };
      })
    };

    return ref;
  }
}

module.exports = FooterTable;