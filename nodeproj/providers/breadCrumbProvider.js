var redis   = require("redis");

var crumbs  = redis.createClient();
//var crumbs = []; //{ session_key = , crumb_array = }

BreadCrumbProvider = function(){
};


BreadCrumbProvider.prototype.resetCrumbArray = function(session_key){
    
    crumbs.get(session_key,  function(err, reply) {
        if(!!reply){
            crumbs.set(session_key,[]);
            return true;
        }
        else
            return false;
    });
}
/*
function updateCrumbs( doc){
    updateCrumbs( doc, crumbs);
}
*/
BreadCrumbProvider.prototype.updateCrumbs = function(session_key, doc, callback){
        var pos = -1;
        var crumbs_array = [];
     // debugger;
        crumbs.get(session_key, function(err, results){
            if(err)
                console.log(err);
            else{  
                if(results != null)
                    crumbs_array = JSON.parse(results);
                
                for(i = 0 ; i < crumbs_array.length; i++){
                    if(crumbs_array[i].nazwa == doc.nazwa ){
                        pos = i;
                        break;
                    }
                }
                
                if(pos > -1){
                    //remove everything after doc (if exist)
                    for(i = pos ;i < crumbs_array.length; i++){
                        if(crumbs_array[i].nazwa != doc.nazwa){
                            crumbs_array.splice(i, 1);
                            i--;
                        }
                    }
                }
                else{
                    crumbs_array.push(doc);
                }
                
                //usuwanie dubli
                var out_a = [];
                var in_a = crumbs_array.reverse(); 
                for(var elem in in_a){
                  var add = true;
                  for(elem_out in out_a){
                    if(in_a[elem].link === out_a[elem_out].link){
                      add = false;
                      break
                    }
                  }
                  if(add === true)
                    out_a.push(in_a[elem]);
                }
                
                //zabezpieczenie uzywania 'go back on page' poprzez sprawdzenie mapy wag
                function getWaga( linkp ){
                    var level_a = [
                                {"link": '/ksiazka/', waga: 1}
                             ,  {"link": '/rozliczacz/rok', waga: 10}
                            ,   {"link": '/rozliczacz/miesiac/', waga: 20}
                            ,   {"link": '/rozliczacz/wpis/', waga: 30} 
                            ,   {"link": '/rozliczacz/wpis/edytuj/', waga: 40}
                            
                            ,   {"link": '/rozliczacz/wpis_schemat/', waga: 30}
                            ,   {"link": '/rozliczacz/wpis_schemat/edytuj/', waga: 40}
                           
                    ];
                  
                    for(var i in level_a)
                      if(level_a[i].link === linkp){
                          return level_a[i].waga;
                      }
                    return 1000;
                }

                for(var i in out_a){
                  for(var j in out_a){
                    if( j > i){
                      if(getWaga(out_a[j].link) > getWaga(out_a[i].link))
                        delete out_a[j];
                    }
                  }
                }
                out_a = out_a.filter(function(e){return e}); //remove undefined elements
                out_a = out_a.reverse();
             
                //console.log("** Bread Crumb Links **")
                
                //for(var elem in out_a)
                //    console.log(out_a[elem].link);
                    
                crumbs.set(session_key, JSON.stringify(out_a));
                callback(null, out_a);
            }
        });
}

exports.BreadCrumbProvider = BreadCrumbProvider;

