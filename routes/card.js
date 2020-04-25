const express = require('express');
const crawler = require('@crawlers/pokemondb');
const router = express.Router();

const maxLimit = 10

const tryAction = (res, action) => {
  try {
    action()
  } catch (err) {
    res
      .status(err.statusCode || 500)
      .send(err.error || err.message);
  }
}

/* GET Pokemon cards */
router.get('/', (req, res) => {
  let { page = 1, limit = maxLimit } = req.query;

  tryAction(res, () => {
    if (limit > 50) limit = maxLimit

    crawler.getPaginatedCards(page, limit)
      .then(({ totalPages, cardPages }) => {
        res
          .set('X-Total-Pages', totalPages)
          .json(cardPages);
      })
  });
});

router.get('/search', (req, res) => {
  let { term } = req.query;

  tryAction(res, () => {
    crawler.getFilteredCards(term, maxLimit + 5)
      .then(filteredCards => {
        res
          .json(filteredCards);
      })
  });
});

module.exports = router;