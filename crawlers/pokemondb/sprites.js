/* eslint-disable no-undef */
require('dotenv').config();

const request = require('request-promise');
const cheerio = require('cheerio');
const _ = require('lodash');

const Helpers = require('@crawlers/helpers');

class Sprites {

  static async getSpritesFor(spriteUrl) {
    const cheerio = await Sprites._getParsedHtml(spriteUrl);
    return Sprites._extractAllSprites(cheerio);
  }

  static async _getParsedHtml(spriteUrl) {
    return request({
      url: spriteUrl,
      method: 'GET',
      transform: html => {
        const $ = Helpers
          .loadPlugins(cheerio.load(html));

        return () => $;
      }
    });
  }

  /**
   * This will extract all sprites from the passed cheerio reference. But the html
   * of that page is a complicated situation, the table that contains all sprites
   * the following structure:
   * 
   * | (empty) | Gen 1 | Gen 2      | ... |
   * |  :---:  | ---   | ---        | --- |
   * |  type   |  img  | img + desc | ... |
   * |  type   |  img  | no img/desc| ... |
   * 
   * The row can has cells with images + description, that isn't obrigatory any of 
   * those items, to handle that the code is divided to parse the expected 
   * structure on separete methods, combining the head title content with row content.   
   *
   * @static
   * @param {() => Cheerio} cheerio Referente to sprite html page already parsed with `cheerio.load`.
   * @returns {{ section: string, table: any[] }[]} The list of entire sprites inside the cheerio reference.
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
        const allTrs = $(table).findArray('tbody tr');

        return {
          section: $h2.text2(),
          table: Sprites._parseAllSpriteTables(cheerio, usableHeads, allTrs)
        };
      });
  }

  static _parseAllSpriteTables(cheerio, usableHeads, allTs) {
    const $ = cheerio();

    return usableHeads
      .map((head, idx) => {
        const data = {
          name: $(head).text(),
          rows: allTs.map(tr => Sprites._trToSpriteRow(cheerio, tr, idx))
        };

        return data;
      });
  }

  static _trToSpriteRow(cheerio, spriteTr, headIdx) {
    const $ = cheerio();
    const allTds = $(spriteTr).findArray('td');
    const $selectedTd = $($(allTds).eq(headIdx + 1));
    const htmlContent = $(_.first(allTds)).html();
    const captionParts = htmlContent.replace(/\n+/g, '')
      .split(/<[^>]*>/g);

    return Sprites._getSpritesInTableRow(cheerio, $selectedTd, captionParts);
  }

  static _getSpritesInTableRow(cheerio, row, rowCaptionParts) {
    const $ = cheerio();
    const $row = $(row);
    const labeledSprites = $row.findArray('> span');
    const unlabeledSprites = $row.findArray('> a');

    const table = {
      captions: _.compact(rowCaptionParts).map(caption => Helpers.decodeEntities(caption)),
      images: [{
        description: '-',
        image: ''
      }]
    };

    Sprites._getLabeledSprites(cheerio, table, labeledSprites);
    Sprites._getUnlabeledSprites(cheerio, table, unlabeledSprites);

    return table;
  }


  static _getLabeledSprites(cheerio, table, labeledSpriteList) {
    if (_.isEmpty(labeledSpriteList)) return;

    table.images = labeledSpriteList
      .map(span => {
        return Sprites._createLabeledSpriteLine(cheerio, span);
      });
  }


  static _createLabeledSpriteLine(cheerio, span) {
    const $ = cheerio()
    const spanText = $(span).text();

    return {
      description: _.some(spanText) ? spanText : '',
      image: Helpers.getImgSrc($, span)
    };
  }

  static _getUnlabeledSprites(cheerio, table, unlabeledSpriteList) {
    const $ = cheerio();

    if (_.isEmpty(unlabeledSpriteList)) return;

    table.images = unlabeledSpriteList
      .map(a => {
        return {
          description: '',
          image: Helpers.getImgSrc($, a)
        };
      });
  }
}

module.exports = Sprites;