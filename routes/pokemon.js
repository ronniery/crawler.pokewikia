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
      console.log(err.stack)

      res
        .status(err.statusCode || 500)
        .send(err.error || err.message);
    });
}).descriptor({
  description: 'Get all pokemon details.',
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