const express = require('express'),
  router = express.Router(),
  fs = require('fs');

/* GET entry application page. */
router.get('/', (_req, res) => {
  'use strict';
  const routeList = fs.readFileSync('./route-list.json', {
    encoding: 'utf8'
  })
    .toString()

  res.json({
    message: 'The server is correctly running!',
    availableRoutes: JSON.parse(routeList)
  });
}).descriptor({
  description: 'Entry point of that API to retrieve documentation.',
  noParams: true
});

module.exports = router;
