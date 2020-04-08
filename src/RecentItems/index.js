import React, { Component } from '../RecentItems'

class RecentItems extends Component {
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
    if (recents.length >= 14) {
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

export default RecentItems