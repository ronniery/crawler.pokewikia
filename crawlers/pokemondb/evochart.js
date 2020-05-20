const _ = require('lodash');

/**
 * Get all evolution data for the current pokemon.
 *
 * @class EvoChart
 */
class EvoChart {

  /**
   * Get the evolution chart.
   *
   * @static
   * @public
   * @param {Function} cheerio Function with page as `Cheerio` library reference.
   * @returns 
   * @memberof EvoChart
   */
  static getEvoChart(cheerio) {
    const $ = cheerio();

    return $('.infocard-list-evo')
      .toArray()
      .map(listEvo => EvoChart._listToEvoChart(cheerio, listEvo))
  }

  /**
   * Convert evolution list to an object with all evolution entries.
   *
   * @static
   * @private
   * @param {Function} cheerio Function with page as `Cheerio` library reference.
   * @param {CheerioElement} evoList Evolution list with data from the current evolution.
   * @returns {{
   *  img: String, 
   *  globalId: String,
   *  name: String,
   *  types: String[],
   *  evolveCondition?: String[]
   * }[]} Evolution chart
   * @memberof EvoChart
   */
  static _listToEvoChart(cheerio, evoList) {
    const $ = cheerio();
    const chunks = _.chunk($(evoList).find('> *'), 2);

    return chunks
      .map(([card, condition]) =>
        EvoChart._createEvoChart(
          cheerio, card, condition
        )
      );
  }

  /**
   * Create a evochart object from the given card and condition.
   *
   * @static
   * @private
   * @param {Function} cheerio Function with page as `Cheerio` library reference.
   * @param {CheerioElement} card Element that contains the data from the pokemon that will evolve.
   * @param {CheerioElement} condition Element that contains the evolution condition.
   * @returns {{
   *  img: String, 
   *  globalId: String,
   *  name: String,
   *  types: String[],
   *  evolveCondition?: String[]
   * }} Evolution chart.
   * @memberof EvoChart
   */
  static _createEvoChart(cheerio, card, condition) {
    const $ = cheerio();
    const $data = $(card).find('.infocard-lg-data');
    const conditionText = $(condition).find('small').text2();
    const rawTypes = $data.find('small').last().findArray('a');

    return {
      img: $(card).find('.img-fixed').attr('data-src'),
      globalId: $data.find('small').first().text2(),
      name: $data.find('a.ent-name').text2(),
      types: rawTypes.map(a => $(a).text2()),
      evolveCondition: _.isEmpty(conditionText) ? [] : conditionText.replace(/[(|)]/g, '').split(/\W\s/)
    }
  }
}

module.exports = EvoChart;