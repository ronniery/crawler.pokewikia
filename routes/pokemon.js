const express = require('express');
const wikia = require('../crawler/wikia');
const router = express.Router();

/* GET Pokemon details */
router.get('/allinfos', (req, res) => {
  'use strict';

  wikia.getAllPokemonInfo(req.query.name).then(infos => {
    res.json(infos);
  });
});

/* GET Pokemon card */
router.get('/cards', (_req, res) => {
  'use strict';

  wikia.getAllCards().then(card => {
    res.json(card);
  });
});

module.exports = router;