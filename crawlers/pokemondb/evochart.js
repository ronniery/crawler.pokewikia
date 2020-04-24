const _ = require('lodash');

class EvoChart {
  static getEvoChart(cheerio) {
    const $ = cheerio();

    return $('.infocard-list-evo')
      .toArray()
      .map(listEvo => EvoChart._listToEvoChart(cheerio, listEvo))
  }

  static _listToEvoChart(cheerio, listEvo) {
    const $ = cheerio();
    const chunks = _.chunk($(listEvo).find('> *'), 2);

    return chunks
      .map(([card, evo]) => EvoChart._createEvoChart(cheerio, card, evo));
  }

  static _createEvoChart(cheerio, card, evo) {
    const $ = cheerio();
    const $data = $(card).find('.infocard-lg-data');
    const condition = $(evo).find('small').text2();
    const rawTypes = $data.find('small').last().findArray('a');

    return {
      img: $(card).find('.img-fixed').attr('data-src'),
      globalId: $data.find('small').first().text2(),
      name: $data.find('a.ent-name').text2(),
      types: rawTypes.map(a => $(a).text2()),
      evolveCondition: _.isEmpty(condition) ? null : condition.replace(/[(|)]/g, '').split(/\W\s/)
    }
  }
}

module.exports = EvoChart;