/**
 * Created by suisiyuan on 17-3-30.
 */
var express = require('express');
var router = express.Router();

var database = require('../database');
var config = require('../config')

// 绑定账号页面
router.get('/bind', function (req, res, next) {
  var openid = req.query.openid;
  database.queryOpenid(openid, function (error, answer) {
    if (answer)
    {
      res.render('message', {title: "绑定设备", content: "已经绑定设备：" + answer.imei + "！"});
    }
    else
    {
      res.render('bind', {title: "绑定设备", content: "请绑定设备！", url: config.localUrl+"/wechat/users/bind?openid="+openid});
    }
  });
});

// 解除绑定
router.get('/unbind', function (req, res, next) {
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


module.exports = router;
