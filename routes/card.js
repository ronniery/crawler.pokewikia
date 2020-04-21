const express = require('express');
const crawler = require('../crawler');
const router = express.Router();

/* GET Pokemon cards */
router.get('/', (req, res) => {
  let { page = 1, limit = 10 } = req.query;

  try {
    if (limit > 50) limit = 10

    crawler.getAllCards(page, limit)
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

module.exports = router;