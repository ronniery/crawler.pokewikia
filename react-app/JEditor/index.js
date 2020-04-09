import React, { Component } from 'react'

class JEditor extends Component {

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

export default JEditor;