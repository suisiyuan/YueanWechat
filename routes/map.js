/**
 * Created by suisiyuan on 17-4-19.
 */

var express = require('express');
var router = express.Router();

var config = require('../config');
var request = require('request');

var database = require('../database');


router.get('/', function (req, res) {
  console.log(req.query);
  res.render('map', {key: config.baiduApiKey, latitude: req.query.latitude, longitude: req.query.longitude});
});

// 实时位置信息
router.get('/realtime', function (req, res) {
  var code = req.query.code;
  var requestUrl = 'https://api.weixin.qq.com/sns/oauth2/access_token?'
    + 'appid=' + config.appid
    + '&secret=' + config.appsecret
    + '&code=' + code
    + '&grant_type=authorization_code';
  request(requestUrl, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var openid = JSON.parse(body).openid;
      database.queryOpenid(openid, function (error, result) {
        if (result)
        {
          request(config.gpsUrl+result.imei, function (error, response, body) {
            if (!error && response.statusCode == 200) {
              var json = JSON.parse(body);
              res.render('map', {key: config.baiduApiKey, latitude: json.gps[0].lat, longitude: json.gps[0].lon})
            }
            else
            {
              res.render('message', {title: "获取位置", content: "该设备没有位置信息！"})
            }
          });
        }
        else
        {
          res.render('message', {title: "获取位置", content: "请先绑定设备！"});
        }
      });


      // res.render('message', {title: "获取openid",content: data.openid});
    }
    else
    {
      res.render('message', {title: "获取openid",content: "获取失败"});
    }
  });
});



module.exports = router;