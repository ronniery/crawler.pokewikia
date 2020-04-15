var getTable = name => {
    const allTables = $('table')

    const table = {
        "Pokédex data": allTables[0],
        "Training": allTables[1],
        "Breeding": allTables[2],
        "Base stats": allTables[3],
        "Type defenses": [allTables[4], allTables[5]],
        "Pokédex entries": allTables[6],
        "Where to find": allTables[7],
        "Other languages": allTables[8]
    } [name]

    return $(table)
}

/* TODO */
var getPokedex = () => {
    const $table = getTable("Pokédex data")
    const trs = $table.find('tr')

    return {
        globalId: getText(trs.eq(0).find('strong')),
        types: trs.eq(1).find('a').toArray().map(a => getText($(a))),
        species: getText(trs.eq(1).find('td')),
        height: getText(trs.eq(2).find('td')),
        width: getText(trs.eq(3).find('td')),
        abilities: trs.eq(4).find('a').toArray().map(a => ({
            name: getText($(a)),
        }))
    }

}

/* OK */
var getBreeding = () => {
    const $table = getTable("Breeding")
    const tds = $table.find('td')

    return {
        eggGroups: getPropertyWithMeta(tds.eq('0')),
        gender: getPropertyWithMeta(tds.eq('1')),
        eggCycles: getPropertyWithMeta(tds.eq('2'))
    }

}

/* OK */
var getTraining = () => {
    const $table = getTable("Training")
    const tds = $table.find('td')

    return {
        evYield: getPropertyWithMeta(tds.eq('0')),
        catchRate: getPropertyWithMeta(tds.eq('1')),
        baseFriendship: getPropertyWithMeta(tds.eq('2')),
        baseExp: getPropertyWithMeta(tds.eq('3')),
        growthRate: getPropertyWithMeta(tds.eq('4')),
    }
}

/* OK */
var getBaseStats = () => {
    const $table = getTable("Base stats")

    return $table.find('tr').toArray().reduce((prev, tr) => {
        const $tr = $(tr)

        prev[_.camelCase(getText($tr.find('th').eq(0)))] = {
            base: getText($tr.find('td').eq(0)),
            max: getText($tr.find('td').eq(2)),
            min: getText($tr.find('td').eq(3))
        }

        return prev
    }, {})
}

/* OK */
var getEvoChart = () => {
    const chunks = _.chunk($('.infocard-list-evo .infocard'), 2)

    return chunks.map(([card, evo]) => {
        const $data = $(card).find('.infocard-lg-data')

        return {
            img: $(card).find('img').attr('src'),
            globalId: getText($data.find('small:first')),
            name: getText($data.find('a.ent-name')),
            types: $data.find('small:last a').map((idx, a) => getText($(a))).toArray(),
            evolveCondition: getText($(evo).find('small'))
        }
    })
}

/* OK */
var getPokedexEntries = () => {
    const $table = getTable("Pokédex entries")

    return $table.find('tr').toArray().reduce((prev, tr) => {
        const $tr = $(tr)
        prev[_.camelCase(getText($tr.find('th')))] = getText($tr.find('td'))
        return prev
    }, {})
}

/* OK */
var getFooterTable = (tableTitle) => {
    const childrens = $('main').find('*')
    const headTableIndex = childrens.toArray().findIndex(el => {
        const regex = new RegExp(tableTitle)
        const text = $(el).text().trim()
        return _.some(text.match(regex))
    })
    const container = childrens[headTableIndex + 1]

    return $(container).find('table tr').toArray().reduce((prev, tr) => {
        const $tr = $(tr)
        prev[_.camelCase(getText($tr.find('th')))] = getText($tr.find('td'))
        return prev
    }, {})
}

/* OK */
var getNameOrigin = () => {
    return _.chunk($('.etymology *'), 2).reduce((prev, [dt, dd]) => {
        prev[_.camelCase($(dt).text())] = $(dd).text()
        return prev
    }, {})
}

/* OK */
var getTypeDefenses = () => {
    return $('.type-table-pokedex').toArray().reduce((prev, table) => {
        const links = $(table).find('tr:first a').toArray()
        const tds = $(table).find('tr:last td')

        links.forEach((a, idx) => {
            prev[_.camelCase($(a).attr('title'))] = $(tds[idx]).attr('title').split(/\s[→|=]\s/g)
        })

        return prev
    }, {})
}

/* OK */
var getMoves = () => {
    const tabs = $('.tabset-moves-game .tabs-tab-list a').toArray()
    const moviments = {}

    tabs.forEach(tab => {
        const $where = $($(tab).attr('href'))
        const all = $where.find('*').toArray()
        const childrens = $where.find('h3').toArray()

        const tabmoves = childrens.map(el => {
            return {
                title: $(el).text(),
                table: all[all.indexOf(el) + 4]
            }
        }).reduce((prev, {
            title,
            table
        }) => {
            prev[_.camelCase(title)] = $(table).find('tbody tr').toArray().map(tr => {
                const tds = $(tr).find('td')

                return {
                    level: +tds.eq(0).text(),
                    move: tds.eq(1).text(),
                    type: tds.eq(2).text(),
                    category: {
                        img: tds.eq(3).find('img').attr('src'),
                        title: tds.eq(3).find('img').attr('title')
                    },
                    power: tds.eq(4).text(),
                    accuracy: tds.eq(5).text()
                }
            })
            return prev
        }, {})

        moviments[_.camelCase($(tab).text())] = tabmoves
    })

    return moviments
}

var getPropertyWithMeta = el => {
    const $el = $(el)
    const $small = $el.find('small')
    const data = {
        text: getText($el.clone().find('small').remove().end())
    }

    if (_.some($small)) {
        data.meta = getText($small)
    }

    return data
}

var getText = el => {
    return $(el)
        .text()
        .trim()
        .replace(/\n+/g, '')
}

var getPokemon = () => {
    const pokedex = getPokedex()

    return Object.assign({
        pokeImg: $('a[rel="lightbox"] img').attr('src'),
        pokeCry: `https://pokemoncries.com/cries-old/${pokedex.globalId}.mp3`
    }, {
        dexdata: pokedex
    }, {
        breeding: getBreeding()
    }, {
        training: getTraining()
    }, {
        basestats: getBaseStats()
    }, {
        evochart: getEvoChart()
    }, {
        dexentries: getPokedexEntries()
    }, {
        whereFind: getFooterTable("Where to find Solosis")
    }, {
        otherLangs: getFooterTable("Other languages")
    }, {
        nameOrigin: getNameOrigin()
    }, {
        defenses: getTypeDefenses()
    })
}