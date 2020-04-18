/* eslint-disable no-undef */
require('dotenv').config();

const request = require('request-promise');
const cheerio = require('cheerio');
const bluebird = require('bluebird');
const _ = require('lodash');
const fs = bluebird.promisifyAll(require('fs'));
const path = require('path');
const { removeBackgroundFromImageFile } = require('remove.bg');
const tinify = bluebird.promisifyAll(require("tinify"));
tinify.key = process.env.TINIFY_KEY;

const Helpers = require('../helpers');
const getImgSrc = ($, el) => $(el).find('span').attr('data-src');
const exists = path => fs.existsSync(path);

class Sprites {

  static async getSpritesFor(pokename) {
    const cheerio = await Sprites._getParsedHtml(pokename);
    return Sprites._extractAllSprites(cheerio);
  }

  static async createSpriteFile(url, { baseName, spriteName = null }) {
    const dir = path.join(__dirname, `../../public/img/sprites/${baseName}`);
    const fileName = spriteName.toLowerCase().replace(' ', '-');
    const spriteFile = `${dir}/${fileName}`;
    const spriteFileExtension = `${spriteFile}.jpg`;

    if (!exists(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (exists(spriteFileExtension)) return Promise.resolve();

    const isURL = str => {
      try {
        new URL(str);
      } catch (_) {
        return false;
      }

      return true;
    };

    const compressImg = async (imgSource) => {
      if (isURL(imgSource)) {
        const source = await tinify.fromUrl(url);
        return source.toFile(spriteFileExtension);
      }

      return fs.readFile(imgSource, (err, sourceData) => {
        if (err) throw err;

        tinify
          .fromBuffer(sourceData)
          .toBuffer((err, resultData) => {
            if (err) throw err;
            fs.writeFileSync(imgSource, resultData);
          });
      });

    };

    const removeBackground = async () => {
      const destination = `${spriteFile}-nobg.png`;

      await removeBackgroundFromImageFile({
        path: spriteFileExtension,
        apiKey: process.env.REMOVEBG_KEY,
        format: 'png',
        outputFile: destination
      }).catch(errors => {
        return JSON.stringify(errors);
      });

      return compressImg(destination);
    };

    await compressImg(url);
    await removeBackground();
  }

  static async _getParsedHtml(pokename) {
    const url = Sprites._fullUrl(pokename);

    return request({
      url,
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
          rows: allTs.map(tr => {
            const allTds = $(tr).findArray('td');
            const $selectedTd = $($(allTds).eq(idx + 1));
            const htmlContent = $(_.first(allTds)).html();
            const captionParts = htmlContent.replace(/\n+/g, '')
              .split(/<[^>]*>/g);

            return Sprites._getSpritesInTableRow(
              cheerio, $selectedTd, captionParts
            );
          })
        };

        return data;
      });
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
    const $ = cheerio();

    if (_.isEmpty(labeledSpriteList)) return;

    table.images = labeledSpriteList
      .map(span => {
        const desc = $(span).text();

        return {
          description: _.some(desc) ? desc : null,
          image: getImgSrc($, span)
        };
      });
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