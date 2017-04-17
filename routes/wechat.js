/**
 * Created by suisiyuan on 17-3-29.
 */
var express = require('express');
var crypto = require('crypto');
var config = require('../config');
var router = express.Router();

var XMLJS = require('xml2js');
var parser = new XMLJS.Parser();
var builder = new XMLJS.Builder();

var request = require('request');

var WechatAPI = require('wechat-api');
var api = new WechatAPI(config.appid, config.appsecret);


var database = require('../database');




// api.getAccessToken(function (err, token) {
//   console.log(err);
//   console.log(token);
// });
//
// var menu = JSON.stringify(require('../menu.json'));
// api.createMenu(menu, function (err, result) {
//   console.log(result);
// });

var templateId = 'TXE8zpyj1lYmkuJh8Dde3Q3jNg6z4G0JEcuaQUQOSPA';
var url = 'http://weixin.qq.com/download';
var data = {
  "first": {
    "value":"玥安消息推送！",
    "color":"#173177"
  },
  "keyword1":{
    "value":"报警",
    "color":"#173177"
  },
  "keyword2": {
    "value":"2017年4月10日",
    "color":"#173177"
  },
  "keyword3": {
    "value":"华中科技大学启明学院704",
    "color":"#173177"
  },
  "remark":{
    "value":"欢迎您关注玥安！",
    "color":"#173177"
  }
};

// api.sendTemplate('ob0aZ08sheyIxptKJRorw12ZxGgU', templateId, url, data, function(err, callback) {
//   console.log(callback);
// });




// 检验服务器合法性
function CheckServer(req, res) {
  var echostr = req.query.echostr;
  var nonce = req.query.nonce;
  var signature = req.query.signature;
  var timestamp = req.query.timestamp;

  var array = [config.token, timestamp, nonce];
  array.sort();

  var sha1Code = crypto.createHash("sha1");
  var code = sha1Code.update(array.join('')).digest("hex");

  if (code === signature) {
    res.send(echostr)
  } else {
    res.send("error");
  }
}

// 接受来自微信的消息
function ResponseMessage(req, res) {
  var nonce = req.query.nonce;
  var openid = req.query.openid;
  var signature = req.query.signature;
  var timestamp = req.query.timestamp;

  var array = [config.token, timestamp, nonce];
  array.sort();
  var sha1Code = crypto.createHash("sha1");
  var code = sha1Code.update(array.join('')).digest("hex");

  // 认证成功
  if (code === signature) {
    req.on("data", function(data) {
      parser.parseString(data.toString(), function(err, result) {
        var body = result.xml;
        var messageType = body.MsgType[0];
        // 如果是事件
        if (messageType === 'event') {
          var eventName = body.Event[0];
          (EventFunction[eventName]||function(){})(body, req, res);
        }
        // 如果是文本
        else if (messageType === 'text') {
          EventFunction.responseNews(body, res);
        }
        else {
          res.send('');
        }
      });
    });
  }
  else {
    res.send("Bad Token!");
  }
}


router.get('/', CheckServer);
router.post('/', ResponseMessage);

// 事件处理器
var EventFunction = {
  // 订阅处理
  subscribe: function(result, req, res) {
    console.log('subscribe');
    var xml = {xml: {
      ToUserName: result.FromUserName,
      FromUserName: result.ToUserName,
      CreateTime: + new Date(),
      MsgType: 'text',
      Content: '欢迎关注'
    }};
    xml = builder.buildObject(xml);
    res.send(xml);
  },
  // 退订处理
  unsubscribe: function(result, req, res) {
    console.log('unsubscribe');
    console.log(result.FromUserName);
    res.send('success');
  },
  VIEW: function () {
    console.log('view');
  },
  responseNews: function(body, res) {
    var xml = {xml: {
      ToUserName: body.FromUserName,
      FromUserName: body.ToUserName,
      CreateTime: + new Date(),
      MsgType: 'text',
      Content: 'test'
    }};
    xml = builder.buildObject(xml);
    res.send(xml);
  }
};




module.exports = router;