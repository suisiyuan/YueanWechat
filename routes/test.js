/**
 * Created by suisiyuan on 17-4-26.
 */

var express = require('express');
var router = express.Router();

var config = require('../config');
var request = require('request');


router.get('/', function (req, res) {
  res.render('message', {title: "测试", content: "测试"});
  // var code = req.query.code;
  // var requestUrl = 'https://api.weixin.qq.com/sns/oauth2/access_token?'
  //                   + 'appid=' + config.appid
  //                   + '&secret=' + config.appsecret
  //                   + '&code=' + code
  //                   + '&grant_type=authorization_code';
  // request(requestUrl, function (error, response, body) {
  //   if (!error && response.statusCode === 200) {
  //     var data = JSON.parse(body);
  //     res.render('message', {title: "获取openid",content: data.openid});
  //   }
  //   else
  //   {
  //     res.render('message', {title: "获取openid",content: "获取失败"});
  //   }
  // });
});


module.exports = router;