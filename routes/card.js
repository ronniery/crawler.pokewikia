const express = require('express'),
  crawler = require('@crawlers/pokemondb'),
  router = express.Router(),
  maxLimit = 10;

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
}).descriptor({
  description: 'Get all pokemon cards with given pagination configuration.',
  params: [
    {
      on: 'query',
      name: 'page',
      description: 'Page number to be fetch.',
      default: 1,
      isMandatory: false
    },
    {
      on: 'query',
      name: 'limit',
      description: 'Limit of items to be returned on the current query.',
      default: maxLimit,
      isMandatory: false
    }
  ],
  response: {
    type: 'json',
    body: { description: 'All cards paginated.' },
    headers: [
      {
        name: 'X-Total-Pages',
        description: 'Show the total of pages for the current card query.'
      }
    ]
  }
})

router.get('/search', (req, res) => {
  let { term } = req.query;

  tryAction(res, () => {
    crawler.getFilteredCards(term, maxLimit + 5)
      .then(filteredCards => {
        res
          .json(filteredCards);
      })
  });
}).descriptor({
  description: 'Search cards using the given term as matcher.',
  params: [
    {
      on: 'query',
      name: 'term',
      description: 'The search term to be searched.',
      isMandatory: true
    }
  ],
  response: {
    type: 'json',
    body: {
      description: `The first ${maxLimit + 5} cards that matches with given searchTerm.`
    }
  }
})

module.exports = router;