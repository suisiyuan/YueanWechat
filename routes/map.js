/**
 * Created by suisiyuan on 17-4-19.
 */

var express = require('express');
var router = express.Router();


router.get('/', function (req, res) {
  console.log(req.query);
  res.render('map', {text: "test", latitude: req.query.latitude, longitude: req.query.longitude});
});

module.exports = router;