var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

RokProvider = function(db, host, port) {
  this.db= new Db(db, new Server(host, port, {auto_reconnect: true}, {}));
  this.db.open(function(){});
};


RokProvider.prototype.getCollection= function(callback) {
  this.db.collection('rok', function(error, result) {
    if( error ) callback(error);
    else callback(null, result);
  });
};


//findAll
RokProvider.prototype.findAll = function(callback) {
    this.getCollection(function(error, doc) {
      if( error ) callback(error);
      else {
			doc.find().sort({datasort: -1}).toArray(function(error, results) {
				if( error ) callback(error);
				else callback(null, results);
				});
      }
    });
};

//findById
RokProvider.prototype.findById = function(id, callback) {
    this.getCollection(
			function(error, doc) 
			{
			  if( error ) callback(error);
			  else {
				doc.findOne({_id :  ObjectID(id)}
				, function(error, result) {
				  if( error ) callback(error);
				  else callback(null, result);
				});
			  }
			}
	);
};

RokProvider.prototype.findByIdExt = function(id){
		var coll = this.db.collection('rok');
		var cursor =  coll.find({ _id : coll.db.bson_serializer.ObjectID.createFromHexString(id)});
		var doc = cursor[0]; 
		debugger;
		
		coll.find({ _id : ObjectID(id)},
			function (error, doc){
				callback(null, doc);
			}
		);
		
		return doc;
};


//TODO - update if exist or insert
RokProvider.prototype.update = function(docId, input_doc, callback){
	this.getCollection(
		function(error, doc){
			if( error ) callback( error );
			else {
				//update (has documentId)
					doc.update(
						{_id: ObjectID(docId)},
						{"$set": input_doc
						},
						function(error, result){
							if( error ) 
								callback(error);
							else 
								callback(null, result);
						});
			}
		}
	);
};

RokProvider.prototype.save = function(input_doc, callback){
	this.getCollection(
		function(error, doc){
			if( error ) callback( error );
			else {
				//update (has documentId)
					doc.save(input_doc,
						function(error, result){
							if( error ) 
								callback(error);
							else 
								callback(null, result);
						});
			}
		}
	);
};



RokProvider.prototype.itemSwitch = function(id, type /* up, down */ , callback) {
   this.getCollection(
			function(error, doc) 
			{
			  if( error ) callback(error);
			  else {
                   doc.find().sort({datasort: -1}).toArray(
                    function(error, results) {
                      if( error )
                        callback(error);
                      else{
                            for(var i = 0; i< results.length; i++){
                                var json = results[i];
                                if(json._id == id){
                                    //get prev
                                    var json_prev;
                                    if(type =='up' && i > 0)
                                        json_prev = results[i - 1];
                                    else if( type == 'down', i < results.length -1 )
                                        json_prev = results[i + 1];
                                        
                                    var datau_prev = json_prev.datasort;
                                    var datau = json.datasort;
                                    //update
                                    doc.update({_id: json._id},{"$set": {'datasort' : datau_prev}});
                                    doc.update({_id: json_prev._id},{"$set": { 'datasort' : datau}});
                                    break;
                                }

                                
                            }
                            callback();
                        }
                    });
			  }
			}
	);
};

/*
   update sortdate
   docs{
    id: 2322
    sort
   }
*/
RokProvider.prototype.itemsSwitch = function(ids, callback) {
   this.getCollection(
        function(error, doc){
            if( error ) 
                callback(error);
            else {
                debugger;
                 //update database
                 var arr = ids.split(",");
                 
                 for(var i = 0 ; i < arr.length ; i++){
                    var id = arr[i];
                    doc.update({_id: ObjectID(id) }, {"$set" : {'datasort' : arr.length - i}}
                    ,
						function(error, result){
							if( error ) 
								callback(error);
						}
                    );
                 }
                 callback();    
           }
        }
    );   
};

exports.RokProvider = RokProvider;