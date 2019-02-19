var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

var MiesiacProvider = require('./miesiacProvider').MiesiacProvider;
var miesiacProvider;

WpisProvider = function(db, host, port) {
  this.db= new Db(db, new Server(host, port, {auto_reconnect: true}, {}));
  this.db.open(function(){});

  miesiacProvider             =  new MiesiacProvider(db, host, port);   
};

WpisProvider.prototype.getCollection = function(callback){
	this.db.collection('wpis', function(error, results) {
    if( error ) callback(error);
    else callback(null, results);
  });
};


function arraymove(arr, fromIndex, toIndex) {
    element = arr[fromIndex];
    arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, element);
}

WpisProvider.prototype.findbyMiesIn = function(arr, callback) {
    this.getCollection(function(error, doc) {
      if( error ) callback(error);
      else {
            doc.find({refmiesiac: {"$in" :  arr }}).sort({ datasort: -1}).toArray(
                function(error, results) {
                  if( error )
                    callback(error);
                  else{
                    //sort results due to arr
                    for(var i = 0; i< arr.length ; i++){
                        for(var j = 0 ; j < results.length; j++){
                            if(arr[i] == results[j].refmiesiac){
                                arraymove(results, j, 0);
                             }
                        }
                    }
                    //console.log("results");
                    //console.log(results.cena);
                    callback(null, results);
                  }
                });
      }
    });
};


WpisProvider.prototype.findbyMies = function(refmies, callback) {
    this.getCollection(function(error, doc) {
      if( error ) callback(error);
      else {
			doc.find({refmiesiac: refmies}).sort({datasort: -1}).toArray(
				function(error, results) {
				  if( error )
				    callback(error);
				  else{
				    callback(null, results);
				  }
				});
      }
    });
};

WpisProvider.prototype.findbyMiesReverseSort = function(refmies, callback) {
    this.getCollection(function(error, doc) {
      if( error ) callback(error);
      else {
			doc.find({refmiesiac: refmies}).sort({datasort: 1}).toArray(
				function(error, results) {
				  if( error )
				    callback(error);
				  else{
				    callback(null, results);
				  }
				});
      }
    });
};


WpisProvider.prototype.findById = function(id, callback) {
    
    console.log(id);

    this.getCollection(
			function(error, doc) 
			{
			  if( error ) callback(error);
			  else {
				doc.findOne({_id: ObjectID(id)}
					, function(error, result) {
				  if( error ) callback(error);
				  else callback(null, result);
				});
			  }
			}
	);
};

WpisProvider.prototype.update = function(id, input_doc, callback) {
	this.getCollection(
		function(error, doc){
			if(error) callback(error);
			else{

          console.log("update wpis**");
          console.log(input_doc);
          console.log(id);

					doc.update(
						{_id: ObjectID(id)}
						,{"$set": input_doc}
						,function(error, result){
							if( error ) {
                console.log('error' + error);
                callback(error);

              }
							else 
              {
                console.log('result' + result);
								callback(null, result);
              }

						}
					);
			}
		}
	);
};

WpisProvider.prototype.save = function(input_doc, callback) {
	this.getCollection(
		function(error, doc){
			if(error) callback(error);
			else{
					doc.save( input_doc
						,
						function(error, result){
							if( error ) 
								callback(error);
							else 
								callback(null, result);
						}
					);
			}
		}
	);
};


/*
          from
            
          vatstawka	: req.param('vatstawka'),
		  typ 	    : req.param('typ'),
          firma     : req.param('firma'),
          nip       : req.param('nip'),
          adres     : req.param('adres'),
          opis      : req.param('opis'),
          
          to
          
          vatstawka   : req.param('vatstawka'),
          typ   : req.param('typ'),
          nazwa : req.param('nazwa'),
          nip   : req.param('nip'),
          adres : req.param('adres'),
          opis  : req.param('opis'),
*/
WpisProvider.prototype.updateWpisy = function(id, inputDoc) {
    this.getCollection(function(error, doc) {
      if( error ) callback(error);
      else {
			//debugger;
			doc.find({refschemat: id}).toArray(function(error, results) {
				  if( error )
				    callback(error);
				  else{
					 for(var i = 0; i< results.length; i++){
                        var json = results[i];
                        
                        var updateDoc = {
                            vatstawka   : inputDoc.vatstawka,
                            typ         : inputDoc.typ,
                            vatodliczenie : inputDoc.vatodliczenie,
                            nazwa       : (inputDoc.firma.length    > 0 ? inputDoc.firma    : json.nazwa),
                            nip         : (inputDoc.nip.length      > 0 ? inputDoc.nip      : json.nip),
                            adres       : (inputDoc.adres.length    > 0 ? inputDoc.adres    : json.adres),
                            opis        : (inputDoc.opis.length     > 0 ? inputDoc.opis     : json.opis),
                            deaktywuj   : inputDoc.deaktywuj
                        } 
                          
                        doc.update({_id: json._id},{"$set": updateDoc});
                     }
				  }
				});
      }
    });
};

WpisProvider.prototype.itemSwitch = function(id, type /* up, down */ , callback) {
   this.getCollection(
			function(error, doc) 
			{
			  if( error ) callback(error);
			  else {
				doc.findOne({_id :  ObjectID(id)}
				, function(error, result) {
				  if( error ) 
					  	callback(error);
				  else {
                       console.log("*1");
                       var refid = result.refmiesiac;
                       
                       doc.find({refmiesiac: refid}).sort({datasort: -1}).toArray(
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
                                callback(null, refid);
                            }
                        });
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
WpisProvider.prototype.itemsSwitch = function(ids, callback) {
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


WpisProvider.prototype.findBy = function(crit, callback) {
    this.getCollection(function(error, doc) {
      if( error ) callback(error);
      else {
      doc.find({'nazwa': {'$regex': crit}}).sort({datasort: -1}).toArray(
        function(error, results) {
          if( error )
            callback(error);
          else{
            callback(null, results);
          }
        });
      }
    });
};

WpisProvider.prototype.findByYear = function(refrok, crit, callback) {
    this.getCollection(function(error, doc) {
      if( error ) callback(error);
      else {

        miesiacProvider.findByRok(refrok, function(error, miesCollection){
              var miesIdArr = [];
              for (var miesId in miesCollection)
                    miesIdArr.push(miesCollection[miesId]._id.toHexString());

              doc.find({refmiesiac: {"$in" :  miesIdArr}, 'nazwa': {'$regex': crit}}).sort({datau: -1}).toArray(
              function(error, results) {
                if( error )
                  callback(error);
                else{
                  callback(null, results);
                }
            });
        });  
      }
    });
};


WpisProvider.prototype.getDistinctByName = function(crit, callback){
  console.log("wywolanie getDistinctByName: "+ crit);
  this.getCollection(function(error, doc) {
      if( error ) callback(error);
      else {
        doc.distinct('nazwa', {'nazwa': {'$regex': crit}},function(err, items) {
            callback(null, items);
        });
      }
  });
}


WpisProvider.prototype.getLastWpisbyName = function(name, callback){
   this.getCollection(function(error, doc) {
      if( error ) callback(error);
      else {
      doc.find({'nazwa': name}).sort({_id: -1}).limit(1).toArray(
        function(error, results) {
          if( error )
            callback(error);
          else{
            callback(null, results[0]);
          }
        });
      }
    });
}



exports.WpisProvider = WpisProvider;
