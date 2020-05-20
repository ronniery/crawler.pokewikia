/* eslint-disable no-undef */
require('dotenv').config();

const request = require('request-promise');
const cheerio = require('cheerio');
const _ = require('lodash');

const Helpers = require('@crawlers/helpers');

/**
 * Fetch the entire sprite page for a given pokemon and parse it.
 *
 * @class Sprites
 */
class Sprites {

  /**
   * Get the entire collection sprites for the given url.
   *
   * @static
   * @public
   * @param {String} url URL to fetch all sprites.
   * @returns {{section: String, table: any[]}} Collection of sprites with 
   * the name of sprite section name and all sprites inside that section.
   * @memberof Sprites
   */
  static async getSpritesFor(url) {
    const cheerio = await Sprites._getParsedHtml(url);
    return Sprites._extractAllSprites(cheerio);
  }

  /**
   * Get the sprite page.
   *
   * @static
   * @private
   * @param {String} url URL to fetch sprite page.
   * @returns {Promise<any>} The `request` promise with the *Cheerio* 
   * reference for the fetched HTML page.
   * @memberof Sprites
   */
  static async _getParsedHtml(url) {
    return request({
      url: url,
      method: 'GET',
      transform: html => {
        const $ = Helpers
          .loadPlugins(cheerio.load(html));

        return () => $;
      }
    });
  }

  /**
   * That function will extract all sprites from the passed cheerio reference. But the HTML
   * of that page is a complicated situation, the table that contains all sprites has
   * the following structure:
   * 
   * | (empty) | Gen 1 | Gen 2      | ... |
   * |  :---:  | ---   | ---        | --- |
   * |  type   |  img  | img + desc | ... |
   * |  type   |  img  | no img/desc| ... |
   * 
   * The row can has cells with images with description, that isn't required any of 
   * those items, to handle that the code is divided to parse the expected 
   * structure on separate methods, combining the head title content with row content.   
   *
   * @static
   * @private
   * @param {() => Cheerio} cheerio Reference to sprite HTML page already parsed with `cheerio.load`.
   * @returns {{ section: string, table: any[] }[]} The list of sprites, with the
   * section name from where the sprite is and the list of sprites from it.
   * @memberof Sprites
   */
  static _extractAllSprites(cheerio) {
    const $ = cheerio();
    $('p').remove();

    return $('h2')
      .toArray()
      .map(h2 => {
        const $h2 = $(h2);
        const table = $h2.next().find('table');
        const allHeads = $(table).findArray('thead th');
        const usableHeads = allHeads.slice(1, allHeads.length);
        const tableRowList = $(table).findArray('tbody tr');

        return {
          section: $h2.text2(),
          table: Sprites._tableRowsToSpriteList(cheerio, usableHeads, tableRowList)
        };
      });
  }

  /**
   * Convert the sprite table as a sprite object list.
   *
   * @static
   * @private
   * @param {Function} cheerio Function with page as `Cheerio` library reference.
   * @param {CheerioElement[]} usableHeads All element heads on the table, to extract
   *  your text, setting from where the *rows* are parsed.
   * @param {CheerioElement[]} tableRowList All table <tr> rows.
   * @returns {{name: String, rows: any[]}[]}
   * @memberof Sprites
   */
  static _tableRowsToSpriteList(cheerio, usableHeads, tableRowList) {
    const $ = cheerio();

    return usableHeads
      .map((head, idx) => {
        const data = {
          name: $(head).text(),
          rows: tableRowList.map(spriteTr =>
            Sprites._tableRowToSprite(cheerio, spriteTr, idx)
          )
        };

        return data;
      });
  }

  /**
   * Convert the table row <tr> as sprite list.
   *
   * @static
   * @private
   * @param {Function} cheerio Function with page as `Cheerio` library reference.
   * @param {CheerioElement} spriteTr Spite table row <tr> to be parsed.
   * @param {Number} headIdx Header index to search on list which <td> should be parsed.
   * @returns {any[]} Sprite list
   * @memberof Sprites
   */
  static _tableRowToSprite(cheerio, spriteTr, headIdx) {
    const $ = cheerio();
    const allTds = $(spriteTr).findArray('td');
    const $selectedTd = $($(allTds).eq(headIdx + 1));
    const htmlContent = $(_.first(allTds)).html();
    const captionParts = htmlContent.replace(/\n+/g, '')
      .split(/<[^>]*>/g);

    return Sprites._getSpriteDataFromTableCell(cheerio, $selectedTd, captionParts);
  }

  /**
   * Extract exact sprite data from table cell <tr> -> <td>. The sprites 
   * could has label and doesn't have label and the 
   *
   * @static
   * @private
   * @param {Function} cheerio Function with page as `Cheerio` library reference.
   * @param {CheerioElement} cell The <td> with sprite data.
   * @param {String[]} rowCaptions Text caption inside <tr>.
   * @returns
   * @memberof Sprites
   */
  static _getSpriteDataFromTableCell(cheerio, cell, rowCaptions) {
    const $ = cheerio();
    const $cell = $(cell);
    const labeledSprites = $cell.findArray('> span');
    const unlabeledSprites = $cell.findArray('> a');

    const dataCell = {
      captions: _.compact(rowCaptions).map(caption => Helpers.decodeEntities(caption)),
      images: [{
        description: '-',
        image: ''
      }]
    };

    Sprites._getLabeledSprites(cheerio, dataCell, labeledSprites);
    Sprites._getUnlabeledSprites(cheerio, dataCell, unlabeledSprites);

    return dataCell;
  }

  /**
   * Get all sprites that has a label.
   *
   * @static
   * @private
   * @param {Function} cheerio Function with page as `Cheerio` library reference.
   * @param {Object} dataCell Reference to previous object created to store sprites.
   * @param {CheerioElement[]} labeledSpriteList All labeled sprite list items.
   * @memberof Sprites
   */
  static _getLabeledSprites(cheerio, dataCell, labeledSpriteList) {
    if (_.isEmpty(labeledSpriteList)) return;

    dataCell.images = labeledSpriteList
      .map(span => {
        return Sprites._createLabeledSpriteLine(cheerio, span);
      });
  }

  /**
   * Create the object that represent a sprite with his description and image.
   *
   * @static
   * @private
   * @param {Function} cheerio Function with page as `Cheerio` library reference.
   * @param {CheerioElement} span Element with sprite data.
   * @returns {{description: String, image: String}} The object with sprite data.
   * @memberof Sprites
   */
  static _createLabeledSpriteLine(cheerio, span) {
    const $ = cheerio()
    const spanText = $(span).text();

    return {
      description: _.some(spanText) ? spanText : '',
      image: Helpers.getImgSrc($, $(span).find('span'))
    };
  }

  /**
   * Get all sprites that doesn't has a label.
   *
   * @static
   * @private
   * @param {Function} cheerio Function with page as `Cheerio` library reference.
   * @param {Object} dataCell Reference to previous object created to store sprites.
   * @param {CheerioElement[]} unlabeledSpriteList All unlabeled sprite list items.
   * @memberof Sprites
   */
  static _getUnlabeledSprites(cheerio, dataCell, unlabeledSpriteList) {
    const $ = cheerio();

    if (_.isEmpty(unlabeledSpriteList)) return;

    dataCell.images = unlabeledSpriteList
      .map(a => {
        return {
          description: '',
          image: Helpers.getImgSrc($, a)
        };
      });
  }
}

module.exports = Sprites;