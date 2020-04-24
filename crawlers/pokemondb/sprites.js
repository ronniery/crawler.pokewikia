/* eslint-disable no-undef */
require('dotenv').config();

const request = require('request-promise');
const cheerio = require('cheerio');
const _ = require('lodash');

const Helpers = require('@crawlers/helpers');
const getImgSrc = ($, el) => $(el).find('span').attr('data-src');

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
      captions: _.compact(rowCaptionParts),
      images: [{
        description: '-',
        image: null
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
      description: _.some(spanText) ? spanText : null,
      image: getImgSrc($, span)
    };
  }

  static _getUnlabeledSprites(cheerio, table, unlabeledSpriteList) {
    const $ = cheerio();

    if (_.isEmpty(unlabeledSpriteList)) return;

    table.images = unlabeledSpriteList
      .map(a => {
        return {
          description: null,
          image: getImgSrc($, a)
        };
      });
  }
}

module.exports = Sprites;