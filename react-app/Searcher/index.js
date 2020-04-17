import React, { Component } from 'react'
import RecentItems from '../RecentItems'

class Searcher extends Component {

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

      fetch(`/pokemon/allinfos?name=${value}`, {
        method: 'GET'
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

export default Searcher