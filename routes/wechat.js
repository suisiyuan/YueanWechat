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



var menu = require('../menu.json');
var oauthUrl = 'https://open.weixin.qq.com/connect/oauth2/authorize?'
                + 'appid=' + config.appid
                + '&redirect_uri=' + config.localUrl + '/wechat/map/realtime'
                + '&response_type=code'
                + '&scope=snsapi_base';
menu.button[0].sub_button[1].url = oauthUrl;
api.createMenu(require('../menu.json'), function (error, result) {
  if (error)
    console.log(error);
  else
    console.log(result);
});


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
    replyText(result.FromUserName[0], result.ToUserName[0], '欢迎关注', res);
  },

  // 退订处理
  unsubscribe: function(result, req, res) {
    console.log('unsubscribe');
    res.send('success');
  },

  // 点击事件
  CLICK: function(result, req, res) {

    if (result.EventKey[0] === 'DEVICE_MANAGEMENT')
    {
      var bindUrl = config.localUrl + "/wechat/users/bind" + "?openid=" + result.FromUserName[0];
      var unbindUrl = config.localUrl + "/wechat/users/unbind" + "?openid=" + result.FromUserName[0];
      var xml = {xml: {
        ToUserName: result.FromUserName[0],
        FromUserName: result.ToUserName[0],
        CreateTime: + new Date(),
        MsgType: 'news',
        ArticleCount: 2,
        Articles: {
          item: [
            {
              Title: "绑定账号",
              Url: bindUrl
            },
            {
              Title: "解除绑定",
              Url: unbindUrl
            }
          ]
        }
      }};
      xml = builder.buildObject(xml);
      res.send(xml);
    }
  }
};



// 接受服务器推送
router.post('/message', function (req, res) {
  var imei = req.body.imei;
  var cmd = req.body.cmd;

  res.send({"code": 0});

  database.queryImei(imei, function (error, result) {
    // 如果有结果的话
    if (result)
    {
      request(config.gpsUrl+imei, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var json = JSON.parse(body);
          var mapUrl = config.localUrl + "/wechat/map" + "?latitude=" + json.gps[0].lat + "&" + "longitude=" + json.gps[0].lon;

          (PushMessageFunction[cmd]||function(){})(mapUrl, result.openid, res);
        }
        else
        {
          (PushMessageFunction[cmd]||function(){})(null, result.openid, res);
        }
      });

    }
  });
});


// 根据推送的命令发送相应的模板消息
var PushMessageFunction = {
  // 自动落锁
  0: function (url, openid, req, res) {
    data.keyword1.value = "自动落锁";
    data.keyword2.value = moment().format('YYYY年MM月DD日 HH:mm:ss');
    api.sendTemplate(openid, config.templateId, url, data, function(err, callback) {
      console.log(callback);
    });
  },
  // 防盗开启
  1: function (url, openid, req, res) {
    data.keyword1.value = "防盗开启";
    data.keyword2.value = moment().format('YYYY年MM月DD日 HH:mm:ss');
    api.sendTemplate(openid, config.templateId, url, data, function(err, callback) {
      console.log(callback);
    });
  },
  // 防盗关闭
  2: function (url, openid, req, res) {
    data.keyword1.value = "防盗关闭";
    data.keyword2.value = moment().format('YYYY年MM月DD日 HH:mm:ss');
    api.sendTemplate(openid, config.templateId, url, data, function(err, callback) {
      console.log(callback);
    });
  },
  // 设备上线
  3: function (url, openid, req, res) {
    data.keyword1.value = "设备上线";
    data.keyword2.value = moment().format('YYYY年MM月DD日 HH:mm:ss');
    api.sendTemplate(openid, config.templateId, url, data, function(err, callback) {
      console.log(callback);
    });
  },
  // 设备离线
  4: function (url, openid, req, res) {
    data.keyword1.value = "设备离线";
    data.keyword2.value = moment().format('YYYY年MM月DD日 HH:mm:ss');
    api.sendTemplate(openid, config.templateId, url, data, function(err, callback) {
      console.log(callback);
    });
  },
  // 移动告警
  5: function (url, openid, req, res) {
    data.keyword1.value = "移动告警";
    data.keyword2.value = moment().format('YYYY年MM月DD日 HH:mm:ss');
    api.sendTemplate(openid, config.templateId, url, data, function(err, callback) {
      console.log(callback);
    });
  },
  // 断电告警
  6: function (url, openid, req, res) {
    data.keyword1.value = "断电告警";
    data.keyword2.value = moment().format('YYYY年MM月DD日 HH:mm:ss');
    api.sendTemplate(openid, config.templateId, url, data, function(err, callback) {
      console.log(callback);
    });
  },
  // 电门开启
  7: function (url, openid, req, res) {
    data.keyword1.value = "电门开启 ";
    data.keyword2.value = moment().format('YYYY年MM月DD日 HH:mm:ss');
    api.sendTemplate(openid, config.templateId, url, data, function(err, callback) {
      console.log(callback);
    });
  },
  // 电门关闭
  8: function (url, openid, req, res) {
    data.keyword1.value = "电门关闭";
    data.keyword2.value = moment().format('YYYY年MM月DD日 HH:mm:ss');
    api.sendTemplate(openid, config.templateId, url, data, function(err, callback) {
      console.log(callback);
    });
  },
  // 低电压告警
  9: function (url, openid, req, res) {
    data.keyword1.value = "低电压告警";
    data.keyword2.value = moment().format('YYYY年MM月DD日 HH:mm:ss');
    api.sendTemplate(openid, config.templateId, url, data, function(err, callback) {
      console.log(callback);
    });
  }
};


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