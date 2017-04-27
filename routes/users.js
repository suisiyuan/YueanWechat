/**
 * Created by suisiyuan on 17-3-30.
 */
var express = require('express');
var router = express.Router();

var database = require('../database');
var config = require('../config')
var request = require('request');


// 设备管理界面
router.get('/', function (req, res, next) {
  var code = req.query.code;
  if (code === null)
  {
    res.send('error');
    return;
  }

  // 使用code获取openid
  var requestUrl = 'https://api.weixin.qq.com/sns/oauth2/access_token?'
    + 'appid=' + config.appid
    + '&secret=' + config.appsecret
    + '&code=' + code
    + '&grant_type=authorization_code';
  request(requestUrl, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var openid = JSON.parse(body).openid;
      database.queryOpenid(openid, function (error, result) {
        // 如果绑定过设备
        if (result)
        {
          res.render('bind', {isBound: true, title: "绑定设备", content: "已经绑定设备：" + result.imei, url: config.localUrl+"/wechat/users/unbind?openid="+openid});
        }
        // 如果没绑定过设备
        else
        {
          res.render('bind', {isBound: false, title: "绑定设备", content: "请绑定设备！", url: config.localUrl+"/wechat/users/bind?openid="+openid});
        }
      });
    }
    else
    {
      res.send('获取openid失败');
    }
  });
});

// 绑定账号
router.post('/bind', function(req, res, next) {
  var imei = req.body.imei;
  var openid = req.query.openid;

  database.queryImei(imei, function (error, answer) {
    if (answer)
    {
      res.render('message', {title: "绑定设备", content: "该设备已被绑定！"})
    }
    else
    {
      database.insertData(imei, openid);
      res.render('message', {title: "绑定设备", content: "已成功绑定设备："+imei})
    }
  });
});

// 解除绑定
router.post('/unbind', function (req, res, next) {
  var openid = req.query.openid;

  database.queryOpenid(openid, function (error, answer) {
    if (answer)
    {
      database.deleteOpenid(openid);
      res.render('message', {title:"解除绑定", content: "解除绑定成功！"});
    }
    else
    {
      res.render('message', {title: "解除绑定", content: "尚未绑定设备！"});
    }
  });
});



module.exports = router;
