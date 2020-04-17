import React, { Component } from 'react'

import Header from '../Header'
import Searcher from '../Searcher'
import JEditor from '../JEditor'

class Container extends Component {

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
    fetch('http://localhost:3002/pokemon/cards')
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

export default Container