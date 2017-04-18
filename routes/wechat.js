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

var menu = JSON.stringify(require('../menu.json'));
api.createMenu(menu, function (error, result) {

});


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
    "value":"",
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
          // EventFunction.responseNews(body, res);
          var content = body.Content[0];
          var matchResult = content.match(/\+\d{15}/);
          if (matchResult)
          {
            var imei = content.substring(matchResult.index+1);
            database.queryImei(imei, function (error, queryResult) {
              if (queryResult)
              {
                var xml = {xml: {
                  ToUserName: body.FromUserName,
                  FromUserName: body.ToUserName,
                  CreateTime: + new Date(),
                  MsgType: 'text',
                  Content: '此设备已经被绑定'
                }};
                xml = builder.buildObject(xml);
                res.send(xml);
              }
              else
              {
                database.queryOpenid(body.FromUserName[0], function (error, result) {
                  if (result)
                  {
                    var xml = {xml: {
                      ToUserName: body.FromUserName,
                      FromUserName: body.ToUserName,
                      CreateTime: + new Date(),
                      MsgType: 'text',
                      Content: '已经绑定设备：' + result.imei
                    }};
                    xml = builder.buildObject(xml);
                    res.send(xml);
                  }
                  else
                  {
                    database.insertData(imei, body.FromUserName[0])
                    var xml = {xml: {
                      ToUserName: body.FromUserName,
                      FromUserName: body.ToUserName,
                      CreateTime: + new Date(),
                      MsgType: 'text',
                      Content: '成功绑定设备：' + imei
                    }};
                    xml = builder.buildObject(xml);
                    res.send(xml);
                  }
                });
              }
            });
          }
          else {
            res.send('success');
          }
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

  // 点击事件
  CLICK: function(result, req, res) {
    console.log('click');

    if (result.EventKey[0] === 'BIND')
    {
      database.queryOpenid(result.FromUserName[0], function (error, answer) {
        if (answer)
        {
          var xml = {xml: {
            ToUserName: result.FromUserName,
            FromUserName: result.ToUserName,
            CreateTime: + new Date(),
            MsgType: 'text',
            Content: '已经绑定设备：' + answer.imei
          }};
          xml = builder.buildObject(xml);
          res.send(xml);
        }
        else
        {
          var xml = {xml: {
            ToUserName: result.FromUserName,
            FromUserName: result.ToUserName,
            CreateTime: + new Date(),
            MsgType: 'text',
            Content: '回复"+imei号"以绑定设备'
          }};
          xml = builder.buildObject(xml);
          res.send(xml);
        }
      });
    }
    else if (result.EventKey[0] === 'UNBIND')
    {
      database.queryOpenid(result.FromUserName[0], function (error, answer) {
        if (answer)
        {
          database.deleteOpenid(result.FromUserName[0]);
          var xml = {xml: {
            ToUserName: result.FromUserName,
            FromUserName: result.ToUserName,
            CreateTime: + new Date(),
            MsgType: 'text',
            Content: '解除绑定成功'
          }};
          xml = builder.buildObject(xml);
          res.send(xml);
        }
        else
        {
          var xml = {xml: {
            ToUserName: result.FromUserName,
            FromUserName: result.ToUserName,
            CreateTime: + new Date(),
            MsgType: 'text',
            Content: '暂未绑定设备'
          }};
          xml = builder.buildObject(xml);
          res.send(xml);
        }
      });
    }
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




// 接受服务器推送
router.post('/message', function (req, res) {
  res.send({code: 0});
  var imei = req.query.imei;
  var cmd = req.query.cmd;

  database.queryImei(imei, function (error, result) {
    // 如果有结果的话
    if (result)
    {
      (PushMessageFunction[cmd]||function(){})(result.openid, req, res);
    }
  });
});


// 根据推送的命令发送相应的模板消息
var PushMessageFunction = {
  // 自动落锁
  0: function (openid, req, res) {
    data.keyword1.value = "自动落锁";
    data.keyword2.value = moment().format('YYYY年MM月DD日 HH:mm:ss');
    api.sendTemplate(openid, templateId, url, data, function(err, callback) {
      console.log(callback);
    });
  },
  // 防盗开启
  1: function (openid, req, res) {
    data.keyword1.value = "防盗开启";
    ddata.keyword2.value = moment().format('YYYY年MM月DD日 HH:mm:ss');
    api.sendTemplate(openid, templateId, url, data, function(err, callback) {
      console.log(callback);
    });
  },
  // 防盗关闭
  2: function (openid, req, res) {
    data.keyword1.value = "防盗关闭";
    ddata.keyword2.value = moment().format('YYYY年MM月DD日 HH:mm:ss');
    api.sendTemplate(openid, templateId, url, data, function(err, callback) {
      console.log(callback);
    });
  },
  // 设备上线
  3: function (openid, req, res) {
    data.keyword1.value = "设备上线";
    ddata.keyword2.value = moment().format('YYYY年MM月DD日 HH:mm:ss');
    api.sendTemplate(openid, templateId, url, data, function(err, callback) {
      console.log(callback);
    });
  },
  // 设备离线
  4: function (openid, req, res) {
    data.keyword1.value = "设备离线";
    ddata.keyword2.value = moment().format('YYYY年MM月DD日 HH:mm:ss');
    api.sendTemplate(openid, templateId, url, data, function(err, callback) {
      console.log(callback);
    });
  },
  // 移动告警
  5: function (openid, req, res) {
    data.keyword1.value = "移动告警";
    ddata.keyword2.value = moment().format('YYYY年MM月DD日 HH:mm:ss');
    api.sendTemplate(openid, templateId, url, data, function(err, callback) {
      console.log(callback);
    });
  },
  // 断电告警
  6: function (openid, req, res) {
    data.keyword1.value = "断电告警";
    ddata.keyword2.value = moment().format('YYYY年MM月DD日 HH:mm:ss');
    api.sendTemplate(openid, templateId, url, data, function(err, callback) {
      console.log(callback);
    });
  },
  // 电门开启
  7: function (openid, req, res) {
    data.keyword1.value = "电门开启 ";
    ddata.keyword2.value = moment().format('YYYY年MM月DD日 HH:mm:ss');
    api.sendTemplate(openid, templateId, url, data, function(err, callback) {
      console.log(callback);
    });
  },
  // 电门关闭
  8: function (openid, req, res) {
    data.keyword1.value = "电门关闭";
    ddata.keyword2.value = moment().format('YYYY年MM月DD日 HH:mm:ss');
    api.sendTemplate(openid, templateId, url, data, function(err, callback) {
      console.log(callback);
    });
  },
  // 低电压告警
  9: function (openid, req, res) {
    data.keyword1.value = "低电压告警";
    ddata.keyword2.value = moment().format('YYYY年MM月DD日 HH:mm:ss');
    api.sendTemplate(openid, templateId, url, data, function(err, callback) {
      console.log(callback);
    });
  }
};



module.exports = router;