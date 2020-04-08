const express = require('express');
const wikia = require('../crawler/wikia');
const router = express.Router();

/* GET Pokemon details */
router.get('/info', function (req, res, next) {
  wikia.getAllPokemonInfo(req.query.name).then(page => {
    res.json(page);
  });
})

router.get('/details', function (req, res, next) {
  wikia.getAllPokemonInfo(req.query.name).then(page => {
    res.json(page);
  });
})

module.exports = router;