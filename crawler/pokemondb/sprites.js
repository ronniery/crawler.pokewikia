const request = require('request-promise');
const cheerio = require('cheerio');
const _ = require('lodash');

const Helpers = require('../helpers');

class Sprites {

  static async getSpritesFor(pokename) {
    const spriteUrl = Sprites._fullUrl(pokename);
    const cheerio = await Sprites._getParsedHtml(spriteUrl);
    return Sprites._extractAllSprites(cheerio);
  }

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

  static _fullUrl(pokename) {
    return `https://pokemondb.net/sprites/${pokename.toLowerCase()}`;
  }

  static _extractAllSprites(cheerio) {
    const $ = cheerio();
    $('p').remove();

    return $('h2')
      .toArray()
      .map(h2 => {
        const table = $(h2).next().find('table');
        const allHeads = $(table).findArray('thead th');
        const usableHeads = allHeads.slice(1, allHeads.length);
        const allTrs = $(table).findArray('tbody tr');

        return {
          section: $(h2).text2(),
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
          rows: allTs.map(tr => {
            const allTds = $(tr).findArray('td');

            // TODO: Check if need $(allTds)
            const $td = $($(allTds).eq(idx + 1));
            // TODO: Refactor
            return Sprites._parseTableRow(
              cheerio,
              allTds,
              $td.findArray('> span'),
              $td.findArray('> a')
            );
          })
        };

        return data;
      });
  }

  static _parseTableRow(cheerio, allTds, childSpans, childLinks) {
    const $ = cheerio();
    const htmlContent = $(_.first(allTds)).html();
    const getImgSrc = el => $(el).find('img').attr('src');
    const captionParts = htmlContent.replace(/\n+/g, '')
      .split(/<[^>]*>/g);

    const data = {
      captions: _.compact(captionParts),
      images: []
    };

    // TODO: split into methods
    if (_.some(childSpans)) {
      data.images = childSpans.map(span =>
        ({
          text: $(span).text(),
          image: getImgSrc(span)
        })
      );
    } else if (_.some(childLinks)) {
      data.images = childLinks.map(a =>
        ({
          image: getImgSrc(a)
        })
      );
    } else {
      data.images = {
        text: '-'
      };
    }

    return data;
  }
}

module.exports = Sprites;