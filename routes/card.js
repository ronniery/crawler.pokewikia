const express = require('express');
const crawler = require('@crawlers/pokemondb');
const router = express.Router();
const maxLimit = 10

/* GET Pokemon cards */
router.get('/', (req, res) => {
  let { page = 1, limit = maxLimit } = req.query;

  try {
    if (limit > 50) limit = maxLimit

    crawler.getPaginatedCards(page, limit)
      .then(({ totalPages, cardPages }) => {
        res
          .set('X-Total-Pages', totalPages)
          .json(cardPages);
      })
  } catch (err) {
    res
      .status(err.statusCode || 500)
      .send(err.error);
  }
});

router.get('/search', (req, res) => {
  let { term } = req.query;

  try {
    crawler.getFilteredCards(term, maxLimit + 5)
      .then(filteredCards => {
        res
          .json(filteredCards);
      })
  } catch (err) {
    res
      .status(err.statusCode || 500)
      .send(err.error);
  }
});

module.exports = router;