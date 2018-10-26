class Container extends React.Component {

    constructor() {
        super();

        this.state = {
            json: this.defaultMessage,
            suggestions: [],

            handlers: {
                onSelectedPokemon: this.onSelectedPokemon.bind(this)
            }
        }
    }

    get defaultMessage() {
        return { empty: "type a pokemon name to show here the result" };
    }

    componentWillMount() {
        fetch('https://api.myjson.com/bins/g3x9g')
            .then(evo => evo.json())
            .then(json => {
                this.setState({
                    suggestions: json.map(poke => poke.name)
                })
            })
    }

    onSelectedPokemon(json) {
        if ($.isEmptyObject(json)) {
            json = this.defaultMessage;
        }

        this.setState({ json })
    }

    render() {
        const { suggestions, handlers } = this.state;
        const isShown = suggestions.length != 0;

        return (
            <div className="row">
                {isShown && <Header />}
                {isShown && <Searcher suggestions={suggestions} onSelectedPokemon={handlers.onSelectedPokemon} />}
                {isShown && <JEditor json={this.state.json} />}
                {!isShown &&
                    <div className="loading col">
                        <img src="./img/loading-xg.svg" className="center-block img-responsive" />
                    </div>
                }
            </div>
        )
    }
}

/**
 * Stateless component to render the main header
 */
const Header = () => (
    <div className="col-12 header">
        <h3>
            All pokemon data are extracted from <a href="http://pokemon.wikia.com" target="_blank">pokemon.wikia.com</a>
        </h3>
    </div>
)

class Searcher extends React.Component {

    constructor() {
        super();

        this.state = {
            typeahead: null,
            isFetching: false,
            selected: {}
        }
    }

    componentDidMount() {
        const { suggestions } = this.props;

        let type = $("#pokemon-name").typeahead({
            hint: true,
            highlight: true,
            minLength: 1,
            templates: {
                empty: [
                    '<div class="empty-message">',
                    'Can\'t find any pokemon with the given name, try again.',
                    '</div>'
                ].join('\n')
            }
        }, {
                name: 'pokemons',
                source: new Bloodhound({
                    datumTokenizer: Bloodhound.tokenizers.whitespace,
                    queryTokenizer: Bloodhound.tokenizers.whitespace,
                    local: suggestions
                })
            })

        type = $(type).bind('typeahead:select', e => {
            this.searchPokemon(e)
        });

        this.setState({ typeahead: type });
    }

    searchPokemon(e) {
        const { onSelectedPokemon } = this.props;
        const { target: { value } } = e;
        const key = e.which || e.keyCode || 0;
        const canGoWithEnter = e.type === "keydown" && key === 13 && value != "";
        const canGoTypeAhead = e.type === "typeahead:select";

        //Enter or typeahead event
        if (canGoWithEnter || canGoTypeAhead) {
            this.setState({
                isFetching: true
            })

            fetch('/details', {
                method: 'POST',
                body: JSON.stringify({ name: value }),
                headers: {
                    "Content-Type": "application/json; charset=utf-8"
                }
            }).then(resp => resp.json())
                .then(json => {
                    this.setState({
                        selected: json,
                        isFetching: false
                    });

                    onSelectedPokemon(json)
                })
        }
    }

    render() {
        const { selected } = this.state;
        const { onSelectedPokemon } = this.props;

        return (
            <div className="col-3 searcher">
                <div className="input-group mb-3">
                    <small className="text-muted">
                        Press <strong>enter</strong> to confirm search.
                    </small>
                    <input
                        type="text"
                        ref="pokemon-name"
                        placeholder="Pokemon name"
                        className={"form-control " + (this.state.isFetching ? "small-loading" : "")}
                        id="pokemon-name"
                        aria-describedby="basic-addon"
                        onKeyDown={(e) => { this.searchPokemon(e) }}
                        disabled={this.state.isFetching}
                    />
                </div>
                <RecentItems
                    toRecent={selected}
                    onSelectedPokemon={onSelectedPokemon}
                />
            </div>
        )
    }
}

class RecentItems extends React.Component {
    constructor() {
        super();

        const { recents } = localStorage;
        this.state = {
            recents: !!recents ? JSON.parse(recents) : []
        }
    }

    componentWillReceiveProps(props) {
        const { toRecent } = props;
        let { recents } = this.state;

        let found = (recents || []).find(hist =>
            hist.nIndex === toRecent.nIndex
        );

        if (!found && !$.isEmptyObject(toRecent)) {
            recents.push(toRecent);
        }

        this.setState({ recents });
        this.saveRecents();
    }

    componentWillUnmount() {
        this.saveRecents();
        this.setState({});
    }

    componentDidUpdate() {
        this.setPopovers();
    }

    componentDidMount() {
        this.setPopovers();
    }

    setPopovers() {
        $(() => {
            $('[data-popover]').popover({
                trigger: 'hover',
                html: true
            })
        })
    }

    saveRecents() {
        $('[data-popover]').popover('hide');

        const { recents } = this.state;

        //Prevent more then 14 itens on recent list
        if(recents.length >= 14) {
            recents.splice(0, 1);
        }

        localStorage.setItem(
            'recents',
            JSON.stringify(recents)
        );
    }

    removePokemon(nIndex) {
        const { recents } = this.state;

        recents.splice(
            recents.findIndex(recent =>
                recent.nIndex === nIndex
            ), 1
        );

        this.setState({ recents });
        this.saveRecents();
    }

    loadSelectedPokemon(nIndex) {
        const { recents } = this.state;
        this.props.onSelectedPokemon(
            recents.find(recents => recents.nIndex === nIndex)
        )
    }

    getRecentListItem(history) {
        const { sprite: { width, height } } = history;
        let img = null;
        let props = {};

        if (width >= 45 && height >= 45) {
            props["data-container"] = "body";
            props["data-toggle"] = "hover";
            props["data-placement"] = "right";
            props["data-content"] = `<img src='${(history.sprite || {}).url}' />`;
            props["data-template"] = '<div class="popover" role="tooltip"><div class="arrow"></div><div class="popover-body"></div></div>';
        } else {
            img = (<img src={(history.sprite || {}).url} />);
        }

        return (
            <li key={history.nIndex}
                className="list-group-item"
                onClick={() => this.loadSelectedPokemon(history.nIndex)}
                data-popover
                {...props}
            >
                {img}
                <span>{history.name}</span>
                <img
                    onClick={() => this.removePokemon(history.nIndex)}
                    src="./img/trash.svg"
                    title="Remove the current associated pokemon"
                />
            </li>
        )
    }

    render() {
        const { recents } = this.state;

        return (
            <div className="history-list">
                {(recents || []).length != 0 &&
                    <ul className="list-group">
                        {recents.map(hist => this.getRecentListItem(hist))}
                    </ul>}
            </div>
        )
    }
}

class JEditor extends React.Component {

    constructor() {
        super();

        this.state = {
            json: null,
            editor: null
        }
    }

    componentWillReceiveProps(props) {
        const { json } = props;
        const { editor } = this.state;

        editor.set(json);
    }

    componentDidMount() {
        const { json } = this.props;

        let editor = new JSONEditor(this.refs["json-editor"]);
        editor.set(json);

        this.setState({ editor });
    }

    downloadJson() {
        const { json } = this.props;
        console.save(json, (json || {}).name || null);
    }

    render() {
        const { json } = this.state;

        return (
            <div className="json-editor col" id="json-editor" ref="json-editor">
                <button
                    className="btn btn-primary btn-download"
                    disabled={json != null}
                    onClick={() => this.downloadJson()}>Download</button>
            </div>
        )
    }
}