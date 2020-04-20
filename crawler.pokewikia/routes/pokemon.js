const express = require('express');
const crawler = require('../crawler');
const router = express.Router();

/* GET Pokemon details */
router.get('/', (req, res) => {
  'use strict';

  crawler.getPokemon(req.query.name)
    .then(details => {
      res.json(details);
    })
    .catch(err => {
      res
        .status(err.statusCode || 500)
        .send(err.error);
    });
});

/* GET Pokemon cards */
router.get('/cards', (_req, res) => {
  'use strict';

  crawler.getAllCards()
    .then(cards => {
      res.json(cards);
    })
    .catch(err => {
      res
        .status(err.statusCode || 500)
        .send(err.error);
    });
});

module.exports = router;