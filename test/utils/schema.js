/* eslint-disable no-undef */
const fs = require('fs');
const path = require('path');

class Schema {
  static async load(schemeName) {
    return new Promise((resolve, reject) => {
      const schemaPath = path.join(__dirname, `../schemas/pokemons/${schemeName}`)

      fs.readdir(schemaPath, (err, files) => {
        if (err) reject(err)

        const schemas = files.reduce((reducer, schema) => {
          const content = fs.readFileSync(`${schemaPath}/${schema}`)

          reducer[
            schema.replace('.json', '')
          ] = JSON.parse(content.toString())

          return reducer
        }, {})

        resolve(schemas)
      })
    })
  }
}

module.exports = Schema