import React from 'react'
import ReactDOM from 'react-dom'

import Container from './Container'

ReactDOM.render(
  <Container />,
  document.getElementById('app')
);

((console) => {

  console.save = (data, filename) => {

    if (!data) {
      return console.error('Console.save: No data');
    }

    if (!filename) {
      filename = 'pokemon';
    }

    if (typeof data === "object") {
      data = JSON.stringify(data, undefined, 4)
    }

    var blob = new Blob([data], { type: 'text/json' }),
      e = document.createEvent('MouseEvents'),
      a = document.createElement('a')

    a.download = `${filename}.json`
    a.href = window.URL.createObjectURL(blob)
    a.dataset.downloadurl = ['text/json', a.download, a.href].join(':')
    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    a.dispatchEvent(e)
  }
})(console)