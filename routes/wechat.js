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
var moment = require('moment');


var WechatAPI = require('wechat-api');
var api = new WechatAPI(config.appid, config.appsecret);

var database = require('../database');



function makeOauthUrl(url) {
  var oauthUrl = 'https://open.weixin.qq.com/connect/oauth2/authorize?'
    + 'appid=' + config.appid
    + '&redirect_uri=' + url
    + '&response_type=code'
    + '&scope=snsapi_base';
  return oauthUrl;
}


var menu = require('../menu.json');
menu.button[0].sub_button[0].url = makeOauthUrl(config.localUrl + '/wechat/users');
menu.button[0].sub_button[1].url = makeOauthUrl(config.localUrl + '/wechat/map/realtime');

api.createMenu(require('../menu.json'), function (error, result) {
  if (error)
    console.log(error);
  else
    console.log(result);
});


// 推送消息命令
var pushCmd = new Array(10);
pushCmd[0] = "自动落锁";
pushCmd[1] = "防盗开启";
pushCmd[2] = "防盗关闭";
pushCmd[3] = "设备上线";
pushCmd[4] = "设备离线";
pushCmd[5] = "移动告警";
pushCmd[6] = "断电告警";
pushCmd[7] = "电门开启";
pushCmd[8] = "电门关闭";
pushCmd[9] = "低电压告警";

// 推送内容
var pushContent = {
   "keyword1":{
     "value":"",
     "color":"#173177"
   },
   "keyword2": {
     "value":"",
     "color":"#173177"
   },
   "keyword3": {
     "value":"",
     "color":"#173177"
   },
   "remark":{
     "value":"欢迎您关注玥安！",
     "color":"#173177"
   }
};



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
          res.send('success');
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
    res.send('success');
  },

  // 退订处理
  unsubscribe: function(result, req, res) {
    console.log('unsubscribe');
    res.send('success');
  },

  // 点击事件
  CLICK: function(result, req, res) {
    res.send('success');
  },

  // 浏览事件
  VIEW: function (result, req, res) {
    res.send('success');
  }

};


// 接受服务器推送
router.post('/message', function (req, res) {
  var imei = req.body.imei;
  var cmd = parseInt(req.body.cmd, 10);

  res.send({"code": 0});

  database.queryImei(imei, function (error, result) {
    // 如果imei号被微信用户绑定
    if (result)
    {
      // 推送用户
      var openid = result.openid;
      // 报警推送的详细页面
      var mapUrl = config.localUrl + "/wechat/map" + "?openid=" + openid;
      // 推送内容
      var content = pushContent;
      content.keyword1.value = pushCmd[cmd];
      content.keyword2.value = moment().format('YYYY年MM月DD日 HH:mm:ss');
      // 推送消息
      api.sendTemplate(openid, config.templateId, mapUrl, content, function (err, result) {
        if (err)
        {
          console.log(err);
        }
        else
        {
          console.log(result);
        }
      });
    }
  });
});


// 被动回复文本
function replyText(to, from, content, res) {
  var xml = {xml: {
    ToUserName: to,
    FromUserName: from,
    CreateTime: + new Date(),
    MsgType: 'text',
    Content: content
  }};
  xml = builder.buildObject(xml);
  res.send(xml);
}

module.exports = router;