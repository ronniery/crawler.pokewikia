var x = document.createElement('script')
x.src = "https://code.jquery.com/jquery-3.5.0.min.js"
document.head.appendChild(x)
var x = document.createElement('script')
x.src = "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.15/lodash.min.js"
document.head.appendChild(x)

var getTable = (name, anchor = null) => {
    const $anchor = _.some(anchor) ? $($(anchor).attr('href')) : $(document)
    const allEls = $anchor.find('*').toArray()
    const currentH2 = $anchor.find('h2').toArray().find(h2 => $(h2).text().trim() === name)
    const position = allEls.indexOf(currentH2)
    const tables = []
    let currentTable = {}

    for (const el of allEls.slice(position + 1, allEls.length)) {
        const withoutHead = _.isEmpty(currentTable)
        const $el = $(el)

        if ($el.is('h3') && withoutHead) {
            currentTable.title = $(el).text()
        } else if ($el.is('table')) {
            currentTable.table = $el
            tables.push(currentTable)
            currentTable = {}
        } else if ($el.is('h2')) {
            break;
        }
    }

    return tables
}

/* TODO */
var getPokedex = anchor => {
    const [{
        table
    }] = getTable("Pokédex data", anchor)
    const $table = $(table)
    return $table.find('tr').toArray().reduce((prev, tr) => {
        const $tr = $(tr)
        const value = getText($tr.find('td'))
        const property = _.camelCase(getText($tr.find('th')))


        if (property === 'local№') {
            const parts = value.split(/(\d{3})\s(\(.*?\))/g)
            const chunks = _.chunk(_.compact(parts), 2)

            prev['localizations'] = chunks.map(([route, game]) => ({
                route,
                game
            }))
        } else if (property === 'abilities') {
            prev['abilities'] = $tr.find('a').toArray().map(el => $(el).text())
        } else {
            prev[property.replace('№', 'Id')] = value
        }

        return prev
    }, {
        name: $(anchor).text()
    })
}

/* OK */
var getBreeding = () => {
    const [{
        table
    }] = getTable("Breeding")
    const $table = $(table)
    const tds = $table.find('td')

    return {
        eggGroups: getPropertyWithMeta(tds.eq('0')),
        gender: getPropertyWithMeta(tds.eq('1')),
        eggCycles: getPropertyWithMeta(tds.eq('2'))
    }
}

/* OK */
var getTraining = () => {
    const [{
        table
    }] = getTable("Training")
    const $table = $(table)
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
var getBaseStats = anchor => {
    const [{
        table
    }] = getTable("Base stats", anchor)
    const $table = $(table)

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
    return $('.infocard-list-evo').toArray().map(listEvo => {

        return _.chunk($(listEvo).find('> *'), 2).map(([card, evo]) => {
            const $data = $(card).find('.infocard-lg-data')
            const condition = getText($(evo).find('small'))

            return {
                img: $(card).find('img').attr('src'),
                globalId: getText($data.find('small:first')),
                name: getText($data.find('a.ent-name')),
                types: $data.find('small:last a').map((idx, a) => getText($(a))).toArray(),
                evolveCondition: _.isEmpty(condition) ? null : condition.replace(/[\(|\)]/g, '').split(/\W\s/)
            }
        })
    })
}

/* OK */
var getPokedexEntries = () => {
    return getTable("Pokédex entries").map(({
        table,
        title
    }) => {
        const $table = $(table)
        const pokename = _.camelCase(_.isEmpty(title) ? $('main > h1').text() : title)
        return $table.find('tr').toArray().reduce((prev, tr) => {
            const $tr = $(tr)
            prev[pokename][_.camelCase(getText($tr.find('th')))] = { 
                text: getText($tr.find('td')),
                originalTitle: _.compact($tr.find('th').html().split(/<[^>]*>/g))
            }
            return prev
        }, {
            [pokename]: {}
        })
    })
}

/* OK */
var getFooterTable = tableTitle => {
    const [{
        table
    }] = getTable(tableTitle)

    return $(table).find('tr').toArray().reduce((prev, tr) => {
        const $tr = $(tr)

        prev[_.camelCase(getText($tr.find('th')))] = {
            text: getText($tr.find('td')),
            links: $tr.find('td a').toArray().map(a => {
                return {
                    link: `https://pokemondb.net${$(a).attr('href')}`,
                    text: $(a).text()
                }
            })
        }

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
var getTypeDefenses = anchor => {
    const $anchor = $($(anchor).attr('href'))
    const typecol = $anchor.find('.tabset-typedefcol')
    const hasTypeCol = _.some(typecol)
    let tables = [
        [null, ..._.chunk($anchor.find('.type-table-pokedex'), 2)]
    ]

    if (hasTypeCol) {
        tables = typecol.find('a.tabs-tab').toArray().map(a => {
            return [_.camelCase($(a).text().replace(' ability', '')), $($(a).attr('href')).find('table').toArray()]
        })
    }


    return tables.map(([ability, [desc, effect]]) => {
        const data = {}

        const links = $(desc).find('tr:first a').toArray()
        const tds = $(effect).find('tr:last td')

        links.forEach((a, idx) => {
            data[_.camelCase($(a).attr('title'))] = $(tds[idx]).attr('title').split(/\s[→|=]\s/g)
        })

        data['ability'] = ability

        return data

    })
}

/* OK */
var getMoves = () => {
    const tabs = $('.tabset-moves-game .tabs-tab-list a').toArray()
    const moviments = {}

    tabs.forEach(tab => {
        const $where = $($(tab).attr('href')).clone()
    $where.find('p').remove()

        const h3s = $where.find('h3').toArray()

        const tabmoves = h3s.map(el => {
debugger;const $el = $(el)

            return {
                title: $el.text(),
                table: $el.next().find('table')
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

/* OK */
var getDerivations = anchor => {
    return Object.assign({
        baseStats: getBaseStats(anchor),
        dexdata: getPokedex(anchor),
        defenses: getTypeDefenses(anchor)
    }, getPokeImg(anchor))
}

var getPokeImg = anchor => {
    return {
        pokeImg: $($(anchor).attr('href')).find('a[rel="lightbox"] img').attr('src')
    }
}

var getSprites = async () => {
    const spriteUrl = `https://pokemondb.net/sprites/${$('main > h1').text().toLowerCase()}`
    const html = await $.ajax({
        url: spriteUrl,
        method: 'GET'
    })

    const $html = $(html)
    $html.find('p').remove()

    const h2s = $html.find('h2')

    return $(h2s).toArray().map(h2 => {
        const table = $(h2).find('+ div > table')
        const rawHeads = $(table).find('thead th').toArray()
        const heads = rawHeads.slice(1, rawHeads.length)
        const trs = $(table).find('tbody tr').toArray()

        return {
            section: $(h2).text(),
            table: heads.map((head, idx) => {
                const data = {
                    name: $(head).text(),
                    rows: trs.map(tr => {
                        const tds = $(tr).find('td').toArray()
                        const $td = $($(tds).eq(idx + 1))
                        const spans = $td.find('> span').toArray()
                        const as = $td.find('> a').toArray()

                        const data = {
                            captions: _.compact($(_.first(tds)).html().replace(/\n+/g, '').split(/<[^>]*>/g)),
                            images: []
                        }

                        if (_.some(spans)) {
                            data.images = spans.map(span => ({
                                text: $(span).text(),
                                image: $(span).find('img').attr('src')
                            }))
                        } else if (_.some(as)) {
                            data.images = as.map(a => ({
                                image: $(a).find('img').attr('src')
                            }))
                        } else {
                            data.images = {
                                text: '-'
                            }
                        }
                        return data;
                    })
                }

                return data;
            })
        }
    })
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

var getPokemon = async (anchor = $("#dex-basics + .tabset-basics > .tabs-tab-list > a.active")) => {
    const pokedex = getPokedex(anchor)

    return Object.assign({
        derivations: $("#dex-basics + .tabset-basics > .tabs-tab-list > a:not(.active)").toArray().map(el => getDerivations(el)),
        pokeCry: `https://pokemoncries.com/cries-old/${pokedex.nationalId}.mp3`
    }, {
        dexdata: pokedex
    }, {
        breeding: getBreeding()
    }, {
        training: getTraining()
    }, {
        basestats: getBaseStats(anchor)
    }, {
        evochart: getEvoChart()
    }, {
        dexentries: getPokedexEntries()
    }, {
        whereFind: getFooterTable(`Where to find ${$('main > h1').text()}`)
    }, {
        otherLangs: getFooterTable("Other languages")
    }, {
        nameOrigin: getNameOrigin()
    }, {
        defenses: getTypeDefenses(anchor)
    }, {
        sprites: await getSprites()
    })
}