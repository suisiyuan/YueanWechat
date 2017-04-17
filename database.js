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
  database = db;

  // get collection
  var col = database.collection('users');


});

// 导出添加函数
exports.insertData = function (imei, openid) {
  var collection = database.collection('users');
  var data = {"imei":imei, "openid":openid, "addTime":new Date()};

  collection.insertOne(data, function (error, result) {
    if (error)
    {
      console.log(error);
    }
    else
    {
      console.log(result.ops);
    }
    database.close();
  });
};


// 导出查询函数
exports.selectData = function (imei, callback) {
  var collection = database.collection('users');

};


// 到处更新函数
exports.updateData = function (imei, openid) {
  var collection = database.collection('users');

};


// 导出删除函数
exports.deleteData = function (imei) {
  var col = database.collection('users');
  col.findOneAndDelete({imei:imei}, function (error, result) {
    if (error)
    {
      console.log(error);
    }
    else
    {
      console.log(result.value);
    }
  })
};