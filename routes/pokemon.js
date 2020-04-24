const express = require('express');
const crawler = require('@crawlers/pokemondb');
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
      console.log(err.stack)

      res
        .status(err.statusCode || 500)
        .send(err.error);
    });
});

module.exports = router;