/**
 * Created by suisiyuan on 17-3-30.
 */

var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient
  ,test = require('assert');

// 数据库路径
var url = "mongodb://localhost:27017/yuean";
var database;

// 连接数据库
MongoClient.connect(url, function(err, db) {
  console.log('连接成功！');
  // 将数据库赋值给全局变量
  database = db;

  // 获取collection
  var collection = database.collection('users');
  // 创建唯一index
  collection.createIndex({imei:1, wechat:2}, {unique:true, background:true, w:1, name:"test"}, function (error, result) {

  });

});

// 导出添加函数
exports.insertData = function (imei, openid, callback) {
  var collection = database.collection('users');
  var doc = {"imei":imei, "openid":openid, "addTime":new Date()};

  exports.selectData(imei, function (error, result) {
    if (!result)
    {
      collection.insertOne(doc, {w:1}, callback);
    }
  });
};

// 导出查询函数
exports.selectData = function (imei, callback) {
  var collection = database.collection('users');
  collection.findOne({imei:imei}, {fields:{openid:1}}, callback);
};

exports.queryOpenid = function (openid, callback) {
  var collection = database.collection('users');
  collection.findOne({openid:openid}, {fields:{imei:1}}, callback);
};


// 导出更新函数
exports.updateData = function (imei, openid, callback) {
  var collection = database.collection('users');
  collection.findOneAndUpdate({imei:imei}, {$set: {openid:openid}}, {upsert: true}, callback);
};

// 导出删除函数
exports.deleteData = function (imei, callback) {
  var collection = database.collection('users');
  collection.findOneAndDelete({imei:imei}, callback);
};

exports.deleteOpenid = function (openid, callback) {
  var collection = database.collection('users');
  collection.findOneAndDelete({openid:openid}, callback);
};