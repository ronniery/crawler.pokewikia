const _ =  require('lodash.first')

module.exports = ($) => {
    const pokeBox = $(".PokéBox");
    const [first, second, third] = $(pokeBox).find("> tbody > tr").toArray();
    const [lbs, kg, hInch, hMeters] = $(third).find("tr").eq(3).find('td').map((idx, el) => $(el).text().trim()).toArray();

    class Selectors {
        get mainTrs() {
            return { first, second, third }
        }

        get jp() {
            let [kanji, jpName] = $(this.mainTrs.first).find("i").text().split(" ")
            return { kanji, jpName }
        }

        get genders() {
            let [male, female] = $(this.mainTrs.third).find("tr").eq(1).text().match(/[0-9]{1,2}.?[0-9]{1,2}/g);
            return { male, female };
        }

        get weight() {
            return { lbs, kg }
        }

        get heigth() {
            return { hInch, hMeters };
        }

        get childTr() {
            return {
                second: $(this.mainTrs.second).find("tr"),
                third: $(this.mainTrs.third).find("tr")
            };
        }

        get nIndex() {
            return _.first(/\d+/g.exec(this.childTr.second.eq(5).text()))
        }
    }

    return new Selectors($);
};