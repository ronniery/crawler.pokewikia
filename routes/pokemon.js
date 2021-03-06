const express = require('express');
const crawler = require('@crawlers/pokemondb');
const router = express.Router();

/* GET Pokemon details */
router.get('/', (req, res) => {
  const { name } = req.query

  crawler.getPokemon(name)
    .then(details => {
      res.json(details);
    })
    .catch(err => {
      res
        .status(err.statusCode || 500)
        .json({
          status: 'ERROR',
          message: err.error || err.message
        });
    });
}).descriptor({
  description: 'Get all pokemon details.',
  usageExample: 'https://arcane-earth-04756.herokuapp.com/pokemon?name=<text>',
  params: [
    {
      on: 'query',
      name: 'name',
      description: 'The pokemon name to be searched.',
      isMandatory: true
    }
  ],
  response: {
    type: 'json',
    body: {
      description: `The matched pokemon and his left and right near neighbors.`
    }
  }
})

module.exports = router;