var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;


SesjaProvider = function(db, host, port) {
  this.db= new Db(db, new Server(host, port, {auto_reconnect: true}, {}));
  this.db.open(function(){});
};

SesjaProvider.prototype.getCollection = function(callback){
	this.db.collection('sesja', function(error, results) {
    if( error ) callback(error);
    else callback(null, results);
  });
};

SesjaProvider.prototype.findBySession = function(refid, callback) {
    this.getCollection(function(error, doc) {
          if(error) 
            callback(error);
          else {
            doc.find({id: refid}).toArray(
				function(error, result) {
				  if( error )
				    callback(error);
				  else{
				    callback(null, result);
                  }
				});
          }
        });
};

SesjaProvider.prototype.save = function(input_doc, callback) {
	this.getCollection(function(error, doc){
			if(error) 
                callback(error);
			else{                                    
                doc.save( input_doc, function(error, result){
                        if( error ) callback(error);
                        else callback(null, result);
                    });       
                }
    });            
};

SesjaProvider.prototype.remove = function(refid, callback) {
	this.getCollection(function(error, doc){
			if(error) 
                callback(error);
			else{                                    
                doc.delete( {id: refid}, function(error, result){
                        if( error ) callback(error);
                        else callback(null, result);
                    });       
                }
    });            
};


exports.SesjaProvider = SesjaProvider;