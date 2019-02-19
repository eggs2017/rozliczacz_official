var Db=require("mongodb").Db,Connection=require("mongodb").Connection,Server=require("mongodb").Server,BSON=require("mongodb").BSON,ObjectID=require("mongodb").ObjectID
WpisSchematProvider=function(e,o,t){this.db=new Db(e,new Server(o,t,{auto_reconnect:!0},{})),this.db.open(function(){})},

WpisSchematProvider.prototype.getCollection=function(e)
{this.db.collection("wpis_schemat",function(o,t){o?e(o):e(null,t)})}
,WpisSchematProvider.prototype.findbyIdIn=function(e,o){this.getCollection(
  function(t,n){t?o(t):n.find({_id:{$in:e}}).sort({datasort:-1}).toArray(
    function(e,t){e?o(e):(console.log("** results len "+t.length),o(null,t))})})}
,WpisSchematProvider.prototype.findByRok=function(e,o){this.getCollection(function(t,n){t?o(t):n.find({refrok:e}).sort({datasort:-1})
  .toArray(function(e,t){e?o(e):o(null,t)})})},WpisSchematProvider.prototype.findById=function(e,o)
{this.getCollection(function(t,n){t?o(t):n.findOne({_id:n.db.bson_serializer.ObjectID.createFromHexString(e)}
  ,function(e,t){e?o(e):o(null,t)})})},WpisSchematProvider.prototype.save=function(e,o){this.getCollection(
  function(t,n){t?o(t):n.save(e,function(e,t){e?o(e):o(null,t)})})}
  ,WpisSchematProvider.prototype.update=function(e,o,t){
    this.getCollection(function(n,i){n?t(n):i.update(
      {_id:i.db.bson_serializer.ObjectID.createFromHexString(e)},{$set:o},function(e,o){e?t(e):t(null,o)})})}



WpisSchematProvider.prototype.copySchemas=function(refrok, refrok_to, callback) {

    this.getCollection(function(error, doc) {
      if( error ) callback(error);
      else {
			doc.find({refrok: refrok}).sort({datasort: -1}).toArray(function(error, results_from) {
                doc.find({refrok: refrok_to}).sort({datasort: -1}).toArray(function(error, results_to) {
                for(var i = 0; i< results_from.length; i++){
                    var json = results_from[i];
                    //check if exist if not add
                    var exists = false;
                    for(var j = 0; j< results_to.length; j++){
                        var json_to = results_to[j];
                        if(json.nazwa == json_to.nazwa){
                            exists = true;
                            break;
                        }
                    }

                    if(!exists){

                        console.log("begin copy");
                        var json_input = {
                              nazwa 	: json.nazwa,
                              refrok 	: refrok_to,//json.refrok,
                              vatstawka	: json.vatstawka,
                              typ 	    : json.typ,
                              firma     : json.firma,
                              adres     : json.adres,
                              opis      : json.opis,
                              datau 	: new Date(),
                              deaktywacja : json.deaktywacja,
                              vatodliczenie : json.vatodliczenie,
                              datasort  : new Date(),
                              //schematTyp: json.schematTyp,
                              nip : json.nip
                        };

                        console.log( "json_input " + json_input);

                        doc.save(json_input, function(error, result){
                            console.log("end copy");
                        });
                    }
                }
            });
        });
      }
    });

    callback(null);
};


WpisSchematProvider.prototype.itemSwitch = function(id, type /* up, down */ , callback) {
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
                       var refid = result.refrok;

                       doc.find({refrok: refid}).sort({datasort: -1}).toArray(
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
WpisSchematProvider.prototype.itemsSwitch = function(ids, callback) {
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

exports.WpisSchematProvider=WpisSchematProvider
