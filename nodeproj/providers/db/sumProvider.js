var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

var RokProvider = require('./rokProvider').RokProvider;
var rokProvider;

var MiesiacProvider = require('./miesiacProvider').MiesiacProvider;
var miesaicProvider;

var WpisProvider = require('./wpisProvider').WpisProvider;
var wpisProvider;

var WpisSchematProvider = require('./wpisSchematProvider').WpisSchematProvider;
var wpisSchematProvider;

var _ = require('underscore');
 


 String.prototype.format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

SumProvider = function(db, host, port) {
  this.db= new Db(db, new Server(host, port, {auto_reconnect: true}, {}));
  this.db.open(function(){});
   
  rokProvider             =  new RokProvider(db, host, port);   
  miesiacProvider         =  new MiesiacProvider(db, host, port);   
  wpisProvider            =  new WpisProvider(db, host, port);   
  wpisSchematProvider     =  new WpisSchematProvider(db, host, port);   
};

SumProvider.prototype.prepareData = function(rok_id, callback){

    rokProvider.findById(rok_id,function(error,rokDocs){
        miesiacProvider.findByRok(rok_id,function(error, miesDocs){
            
            var miesIdklonG = [];
                  
            _.each(miesDocs, function(elem) {
                miesIdklonG.push(elem._id.toHexString());
              });

            wpisProvider.findbyMiesIn(miesIdklonG, function (error,wpisDocs){
                
                var schematklonG = [];
                    
                var obj = require('mongodb').ObjectID
                _.each(wpisDocs, function(elem){
                        schematklonG.push(obj(elem.refschemat));
                });

                wpisSchematProvider.findbyIdIn(schematklonG,function (error,schematy){
                        //console.log("input  schematy");
                        //console.log(schematy); 
                        return callback(null, kalkuluj(rokDocs, miesDocs, wpisDocs, schematy), rokDocs.nazwa);
                });
            });            
        });    
    });
};

 function partition(items, size) {
    var result = _.groupBy(items, function(item, i) {
        return Math.floor(i/size);
    });
    return _.values(result);
}

function kalkuluj(rokDocs, miesDocs, wpisDocs, schematy){
    var stale = {
                podatekstawka       : rokDocs.podatekstawka,
                kwotawolna          : parseLocalNum(rokDocs.kwotawolna),
                dzielnik_vat        : rokDocs.dzielnik_vat
        }
    
    //formatowanie i usuwanie deaktywowanych elementów przed kalkulacja
    _.each(wpisDocs, function(elem, key){
        elem.cena = parseLocalNum(elem.cena);
        
        if(elem.deaktywuj  == "on"){
            delete wpisDocs[key];
        }
    });

    //grupowanie po typ/mies
    var klonG = []
    _.each(wpisDocs, function(elem) {klonG.push(_.clone(elem))});

    //formatowanie
    _.each(klonG, function(elem) {
        var mies = _.find(miesDocs, function(l_elem) { return l_elem._id.toHexString() == elem.refmiesiac; });
        elem.nazwa = mies.nazwa; 
        elem.datasort = mies.datasort;//potrzebne do sortowania
        elem.odliczenia = parseLocalNum(mies.odliczeniestawka); 

        //elem.cena_w = 0; //elem.cena_p = 0; ??
        elem.vat_sum_p = 0;
        elem.vat_sum_w = 0;
    });

    klonG =  grupuj(klonG, function(obj){return {v1:obj.refmiesiac, v2:obj.typ};});

    _.each(_.where(klonG, {'typ' : '-1'}), function(elem){elem.cena_w = elem.cena});
    _.each(_.where(klonG, {'typ' : '1'}), function(elem){elem.cena_p = elem.cena});

    //mergowanie typow w jeden element oraz usuniecie zbednego
    klonG = _(klonG).sortBy("nazwa");
    for(var i in klonG){
        if (i > 0 && klonG[i].nazwa === klonG[i-1].nazwa){
            _.extend(klonG[i],klonG[i-1]);
            delete  klonG[i]["typ"];
            klonG.splice(i-1,1);
        }
    }
    
    klonG = _(klonG).sortBy("datasort"); //sortuje zeby policzyc cyklicznie
    //policz cyklicznie podatek
    var sum_doch = 0;
    var sum_odlicz = 0;
    var sum_pod = 0;

    _.each(klonG, function(elem){
        elem.cena_p = elem.cena_p == undefined ? 0 : elem.cena_p;
        elem.cena_w = elem.cena_w == undefined ? 0 : elem.cena_w;

        elem.dochod = elem.cena_p - elem.cena_w; 
        elem.vat    = elem.vat_sum_p - elem.vat_sum_w;
        
        //policz
        sum_doch += elem.dochod;
        sum_odlicz  += elem.odliczenia;

        var podatek =  sum_doch.toFixed(0) * stale.podatekstawka - sum_odlicz - stale.kwotawolna - sum_pod;
        elem.podatek_narastajaco  = podatek;
        
        sum_pod += (podatek > 0 ? +(podatek).toFixed(0) : 0);//bardzo wazne
      
        elem.vat_details = [];
        elem.vat_details_group = [];
    });

    //grupowanie vatu po typ/mies/stawka
        var klon1 = [];
        _.each(wpisDocs, function(elem) {  klon1.push(_.clone(elem))});
        klon1 = grupuj(klon1, function(obj) {return {v1:obj.refmiesiac, v2:obj.typ, v3:obj.vatstawka};}, false);
        

    //podlacz tablice grupujace i ustalenie vat_sum
     _.each(klon1, function(p_elem) {
    
        var found = _.find(klonG, function(elem) {return elem.refmiesiac === p_elem.refmiesiac});
        if( found ){
            found.vat_details.push(p_elem);
            if(p_elem.typ == "-1")
                found.vat_sum_w += p_elem.vat_sum;
            else
                found.vat_sum_p += p_elem.vat_sum;
            
            found.vat_roznica = found.vat_sum_p - found.vat_sum_w;
        }
    });


    //kwartalne
    if(stale.dzielnik_vat > 1){
	    _.each(partition(klonG, stale.dzielnik_vat), function(miesArr){
	        var miesLis = _.pluck(miesArr, 'refmiesiac');
	        var klon2 = []
	           _.each(klon1, function(elem) {
	               if(_.contains(miesLis, elem.refmiesiac)){
	                var c_elem = _.clone(elem);
	                   c_elem.refmiesiac = _.last(miesLis); //przypisuj dla statniego elem. w liscie
	                   klon2.push(c_elem);
	               }
	           });

	           klon2 = grupuj_kw(klon2,  function(obj){return {v1:obj.vatstawka, v2:obj.typ};});
	       
	           //podlacz
	           _.each(klon2, function(p_elem) {
	            var found = _.find(klonG, function(elem) {return elem.refmiesiac === p_elem.refmiesiac});
	            found.vat_details_group.push(p_elem);
	        });
	    });
	}
   
    //podsumowanie roczne niezalezne 
    rok_elem = {'nazwa' : 'Podsumowanie roczne {0}'.format(rokDocs.nazwa) , 'cena_p': 0, 'cena_w': 0, 'vat_sum_p' : 0, 'vat_sum_w' :0, 'dochod' : 0,  'vat' : 0, 'odliczenia' : 0, 'podatek_narastajaco' : 0, 'vat_details': [], 'vat_details_group' : []};

    _.each(klonG, function(elem){
        rok_elem.cena_p         += elem.cena_p;
        rok_elem.cena_w         += elem.cena_w;

        rok_elem.vat_sum_p      += elem.vat_sum_p;
        rok_elem.vat_sum_w      += elem.vat_sum_w;

        rok_elem.vat            += elem.vat;

        rok_elem.dochod         += elem.dochod;
        rok_elem.odliczenia     += elem.odliczenia;

        rok_elem.podatek_narastajaco += elem.podatek_narastajaco > 0 ? +(elem.podatek_narastajaco).toFixed(0) : 0;//bardzo wazne
    });
    rok_elem.vat_roznica = rok_elem.vat_sum_p - rok_elem.vat_sum_w;
    
    klonG.push(rok_elem);

    //odwrocenie do prezentacji
    klonG.reverse();
    return klonG;
};

//withCena = false - do grupowania vat sumuj cene bez powiekszania o polowiczny vat
function grupuj(objects, compare_, withCena){
    if(typeof(withCena)==='undefined') withCena = true;//default value

    var categories = [];
    var groupedObjects = [];
    _.each(objects,function(obj){
        var existingObj;
        var objCom = compare_(obj);//mod1   
        if(_.find(categories, function(e) { return JSON.stringify(e) === JSON.stringify(objCom)})) {
            existingObj = _.find(objects,function(obj){return (JSON.stringify(compare_(obj)) === JSON.stringify(objCom) )}); //mod2});
            if(existingObj)

                var vo = obj.vatodliczenie;
                
                existingObj.vat_sum +=  (obj.vatstawka * obj.cena) * (vo > 0? vo : 1);
                if(withCena)
                    existingObj.cena += +(obj.cena) + ( vo > 0 ? (obj.vatstawka * obj.cena) *(1- vo) : 0);//kolejnosc jest wazna
                else
                    existingObj.cena += +(obj.cena);
        }
        else {
            var vo = obj.vatodliczenie;
            obj.vat_sum = (obj.vatstawka * obj.cena) * (vo > 0? vo : 1);
            if(withCena)
                obj.cena = +(obj.cena) + ( vo > 0 ? (obj.vatstawka * obj.cena) *(1- vo) : 0);
            else
                obj.cena = +(obj.cena);
      

            groupedObjects.push(obj);
            categories.push(objCom);
        }
    });

    return  groupedObjects;
}

function grupuj_kw(objects, compare_){
    var categories = [];
    var groupedObjects = [];
    _.each(objects,function(obj){
        var existingObj;
        var objCom = compare_(obj);//mod1   
        if(_.find(categories, function(e) { return JSON.stringify(e) === JSON.stringify(objCom)})) {
            existingObj = _.find(objects,function(obj){return (JSON.stringify(compare_(obj)) === JSON.stringify(objCom) )}); //mod2});
            if(existingObj)
                existingObj.vat_sum +=  +(obj.vat_sum); 
                existingObj.cena += +(obj.cena) 

                //console.log("suma typ/cena/vat/vat_add/vatstawka " +  existingObj.typ + "/" + existingObj.cena +  "/" + existingObj.vat_sum  + "/" + vat_add + "/" + existingObj.vatstawka )
        }
        else {
            obj.vat_sum = +(obj.vat_sum);
            obj.cena = +(obj.cena);

            //console.log("**suma typ/cena/vat/vatstawka " +  obj.typ +  "/" + obj.cena + "/" + obj.vat_sum  + "/" + obj.vatstawka)

            groupedObjects.push(obj);
            categories.push(objCom);
        }
    });

    return  groupedObjects;
}

function parseLocalNum(num) {
    var str_num = String(num);
    return Number(str_num.replace(",", "."));
}

exports.SumProvider = SumProvider;