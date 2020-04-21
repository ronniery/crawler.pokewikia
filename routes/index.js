const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
  'use strict';
  
  res.json({
    message: 'Hello world!'
  });
});

module.exports = router;
