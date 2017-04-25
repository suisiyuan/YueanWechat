/**
 * Created by suisiyuan on 17-4-19.
 */

var express = require('express');
var router = express.Router();

var config = require('../config');

router.get('/', function (req, res) {
  console.log(req.query);
  res.render('map', {key: config.baiduApiKey, latitude: req.query.latitude, longitude: req.query.longitude});
});

module.exports = router;