const _ = require('lodash')

const Helpers = require('@crawlers/helpers')

class FooterTable {
  static getFooterTable(cheerio, tableHeader, baseUrl) {
    const foundEl = Helpers.searchTableOnDocument(cheerio, { name: tableHeader });

    if (_.isEmpty(foundEl)) return {}

    const [{ table }] = foundEl

    return FooterTable._tableToFooter(cheerio, table, baseUrl)
  }

  static _tableToFooter(cheerio, table, baseUrl) {
    const $ = cheerio();

    return $(table)
      .findArray('tr')
      .reduce((reducer, tr) => {
        return FooterTable._createFooter(
          cheerio, reducer, tr, baseUrl
        )
      }, {});
  }

  static _createFooter(cheerio, reducer, tr, baseUrl) {
    const $ = cheerio();
    const $tr = $(tr);
    const $th = $tr.find('th');
    const property = _.camelCase($th.text2());

    reducer[property] = {
      text: $tr.find('td').text2(),
      links: $tr.findArray('td a').map(a => {
        const $a = $(a);

        return {
          link: `${baseUrl}${$a.attr('href')}`,
          text: $a.text2()
        };
      })
    };

    return reducer;
  }
}

module.exports = FooterTable;