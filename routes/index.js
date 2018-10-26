const express = require('express');
const wikia = require('../crawler/wikia');
const router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

/* POST route */
router.post('/details', function (req, res, next) {
  wikia.getPokemonInfo(req.body.name).then(page => {
    res.json(page);
  });
})

module.exports = router;
