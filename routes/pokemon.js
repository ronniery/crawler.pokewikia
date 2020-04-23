const express = require('express');
const crawler = require('../crawler/pokemondb');
const router = express.Router();

/* GET Pokemon details */
router.get('/', (req, res) => {
  const { name } = req.query

  // Genesect bug
  crawler.getPokemon(name)
    .then(details => {
      res.json(details);
    })
    .catch(err => {
      res
        .status(err.statusCode || 500)
        .send(err.error);
    });
});

module.exports = router;