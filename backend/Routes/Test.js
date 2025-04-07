var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('ines noussa');
});

module.exports = router;

var express = require('express');
var router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Test route works!' });
});

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('ines noussa');
});

module.exports = router;
