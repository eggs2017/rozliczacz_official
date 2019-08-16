RoutesProvider = function(app, nconf){
    this.app = app;
    this.db     = nconf.get('mongodb:name');
    this.dbhost = nconf.get('mongodb:host');
    this.dbport = nconf.get('mongodb:port');

    console.log("database settings " +  this.db);
}

RoutesProvider.prototype.getRoutes = function(){

    var BreadCrumbProvider = require('./breadCrumbProvider').BreadCrumbProvider;
    var breadProvider = new BreadCrumbProvider();

    var RokProvider = require('./db/rokProvider').RokProvider;
    var rokProvider =  new RokProvider(this.db, this.dbhost, this.dbport);

    var MiesiacProvider = require('./db/miesiacProvider').MiesiacProvider;
    var miesiacProvider =  new MiesiacProvider(this.db, this.dbhost, this.dbport);

    var WpisProvider = require('./db/wpisProvider').WpisProvider;
    var wpisProvider = new WpisProvider(this.db, this.dbhost, this.dbport);

    var WpisSchematProvider = require('./db/wpisSchematProvider').WpisSchematProvider;
    var wpisSchematProvider = new WpisSchematProvider(this.db, this.dbhost, this.dbport);



    var SesjaProvider = require('./db/sesjaProvider').SesjaProvider;
    var sesjaProvider = new SesjaProvider(this.db, this.dbhost, this.dbport);

    var SumProvider = require('./db/sumProvider').SumProvider;
    var sumProvider =  new SumProvider(this.db, this.dbhost, this.dbport);



    function parseLocalNum(num) {
        var str_num = String(num);
        return +(str_num.replace(",", "."));
    }

    function formatDate(cdate){
      var currentDate = cdate;
      var dd = currentDate.getDate();
      var mm = currentDate.getMonth() + 1;
      var yyyy = currentDate.getFullYear();
      if(dd<10){
        dd='0'+dd
      }
      if(mm<10){
        mm='0'+mm}

        return  yyyy+'-'+mm+'-'+dd;
    }
    function formatDateTime(cdate){
        return  formatDate(cdate) + "T07:01:55" ;
    }


    // simple logger
    this.app.use(function(req, res, next){
      console.log('**Wywolanie: %s %s session: %s user: %s', req.method, req.url, req.session.id, req.user);
      next();
    });

    var link = '/';
    this.app.get( link,  function(req, res){
      res.redirect('/rozliczacz/rok');
    });

    var link = '/rozliczacz';
    this.app.get( link,  function(req, res){
      res.redirect('/rozliczacz/rok');
    });
    /* rok */

    var crumb_name = 'książka';
    var link = '/rozliczacz/rok';
    this.app.get( link,  function(req, res){

        rokProvider.findAll(
            function(error,doc){
                breadProvider.resetCrumbArray(req.session.id);//this is root
                var crumb = {
                            nazwa   : crumb_name,
                            link    : link
                        };
                breadProvider.updateCrumbs(req.session.id, crumb, function(error, ret) {
                    res.render('rok.jade', {title: 'Rozliczacz', params: doc, crumbs: ret});
                });
            });
    });

    this.app.get('/rozliczacz/rok/edytuj/:id', function(req, res){
    rokProvider.findById(req.params.id,
            function(error,doc){
                var crumb = {
                            nazwa   : 'edycja dla ' + doc.nazwa,
                            link    : '/rozliczacz/rok/edytuj/',
                            id      : req.params.id
                        };

                breadProvider.updateCrumbs(req.session.id, crumb, function(error, crumbs_){
                   res.render('rok_edycja.jade', {title: 'Edycja', params: doc, crumbs : crumbs_});
                });

            });
    });

    this.app.post('/rozliczacz/rok/edytuj/:id', function(req, res){
       rokProvider.update(req.params.id,
        {
          nazwa : req.param('nazwa'),
          kwotawolna        : req.param('kwotawolna'),
          podatekstawka     : req.param('podatekstawka'),
          odliczeniestawka  : req.param('odliczeniestawka'),
          dzielnik_vat      : req.param('dzielnik_vat'),
          datam             : new Date()
        },
        function( error, docs) {
            console.log(error)
           res.redirect('/rozliczacz/rok');
       });
    });

    this.app.get('/rozliczacz/rok/nowy', function(req, res){
            var crumb = {
                                nazwa   : 'utwórz rok',
                                link    : '/rozliczacz/rok/nowy'
                            };

            breadProvider.updateCrumbs(req.session.id, crumb, function(error, crumbs_){
                res.render('rok_nowy.jade', {title: 'Nowy', crumbs: crumbs_});
            });


    });

    this.app.post('/rozliczacz/rok/nowy', function(req, res){
           rokProvider.save(
            {
              nazwa : req.param('nazwa'),
              kwotawolna        : req.param('kwotawolna'),
              podatekstawka     : req.param('podatekstawka'),
              odliczeniestawka  : req.param('odliczeniestawka'),
              dzielnik_vat      : req.param('dzielnik_vat'),
              datau             : new Date(),
              datasort          : new Date()
            },
            function( error, docs) {
               res.redirect('/rozliczacz/wpis_schemat/' + docs._id);
           });
    });

    this.app.get('/rozliczacz/test/:id', function(req, res){
        var doc = rokProvider.findByIdExt(req.params.id);

        console.log('/rozliczacz/test/' + doc);
    });


    /* wpis_schemat */

    this.app.get('/rozliczacz/wpis_schemat/:refrok', function(req, res){
        rokProvider.findById(req.params.refrok,function(error,rokDoc){
            wpisSchematProvider.findByRok(req.params.refrok,function(error,doc){
                    rokProvider.findAll(
                    function(error,rok_doc){
                        var crumb = {
                                nazwa   : 'schematy',
                                link    : '/rozliczacz/wpis_schemat/',
                                id      : req.params.refrok
                            };

                        breadProvider.updateCrumbs(req.session.id, crumb, function(error, crumbs_){
                            res.render('wpisSchemat.jade', {title: 'Lista schematów', params: doc, rok_arr: rok_doc, refrok: req.params.refrok, crumbs: crumbs_});
                        });
                    });

                });
        });
    });

    this.app.get('/rozliczacz/wpis_schemat/nowy/:refrok', function(req, res){
        rokProvider.findById(req.params.refrok,function(error,rokDoc){
            var crumb = {
                                nazwa   : 'Utwórz nowy schemat',
                                link    : '/rozliczacz/wpis_schemat/nowy/',
                                id      : req.params.id
                            };

                breadProvider.updateCrumbs(req.session.id, crumb, function(error, crumbs_){
                        res.render('wpisSchemat_nowy.jade', {title: 'Nowy', rokDoc : rokDoc, crumbs: crumbs_});
                });

        });
    });

    this.app.post('/rozliczacz/wpis_schemat/nowy/:refrok', function(req, res){
           wpisSchematProvider.save(
            {
                nazwa   : req.param('nazwa'),
                refrok  : req.param('refrok'),
                vatstawka   : req.param('vatstawka'),
                typ         : req.param('typ'),
            firma     : req.param('firma'),
            nip       : req.param('nip'),
            adres     : req.param('adres'),
            opis      : req.param('opis'),
            deaktywuj : req.param('deaktywuj'),
            vatodliczenie : req.param('vatodliczenie'),
                datau     : new Date(),
            datasort  : new Date()
            },
            function( error, docs) {
               res.redirect('/rozliczacz/wpis_schemat/'+req.param('refrok'));
           });
    });

    this.app.get('/rozliczacz/wpis_schemat/edytuj/:id', function(req, res){
        wpisSchematProvider.findById(req.params.id,
                function(error,doc){
                    var crumb = {
                                nazwa   : 'edycja dla ' + doc.nazwa,
                                link    : '/rozliczacz/wpis_schemat/edytuj/',
                                id      : req.params.id
                            };

                    breadProvider.updateCrumbs(req.session.id, crumb, function(error, crumbs_){
                        res.render('wpisSchemat_edycja.jade', {title: 'Edycja', param: doc , crumbs: crumbs_});
                    });
                });
    });

    this.app.post('/rozliczacz/wpis_schemat/edytuj/:id', function(req, res){

           var jsonDoc = {
                  nazwa     : req.param('nazwa'),
                  vatstawka : req.param('vatstawka'),
                  typ       : req.param('typ'),
              firma     : req.param('firma'),
              nip       : req.param('nip'),
              adres     : req.param('adres'),
              opis      : req.param('opis'),
              deaktywuj : req.param('deaktywuj'),
              vatodliczenie : req.param('vatodliczenie'),
                  datam     : new Date()
            };

            //TODO put transaction

           wpisSchematProvider.update(req.params.id, jsonDoc, function( error, docs) {

               if(req.param('aktualizuj')) {
                    //aktualizacja aktualnych wpisów
                    wpisProvider.updateWpisy(req.params.id, jsonDoc);
               }

               wpisSchematProvider.findById(req.params.id, function(error,doc){
                        res.redirect('/rozliczacz/wpis_schemat/'+ doc.refrok);
                });
           });
    });


    this.app.get('/rozliczacz/wpis_schemat/kopiuj/:refrok_from/:refrok_to', function(req, res){
            //TODO - invoke function to copy schemas
            wpisSchematProvider.copySchemas(req.params.refrok_from, req.params.refrok_to, function(error,doc){
                res.redirect('/rozliczacz/wpis_schemat/'+ req.params.refrok_to);
            });
    });
    /* miesiac */

    this.app.get('/rozliczacz/miesiac/:refrok', function(req, res){
        rokProvider.findById(req.params.refrok,function(error,rokDoc){
            miesiacProvider.findByRok(req.params.refrok,
                function(error,doc){
                    var crumb = {
                                nazwa   : '' + rokDoc.nazwa,
                                link    : '/rozliczacz/miesiac/',
                                id      : req.params.refrok
                            };

                    breadProvider.updateCrumbs(req.session.id, crumb, function(error, crumbs_){
                        res.render('miesiac.jade', {title: 'Lista miesięcy', params: doc, refrok: req.params.refrok, crumbs: crumbs_});
                    });
                });
        });
    });


    this.app.get('/rozliczacz/miesiac/nowy/:refrok', function(req, res){
        rokProvider.findById(req.params.refrok,function(error,rokDoc){
            var crumb = {
                                nazwa   : 'utworz miesiąc ',
                                link    : '/rozliczacz/miesiac/nowy/',
                                id      : req.params.id
                            };

            breadProvider.updateCrumbs(req.session.id, crumb, function(error, crumbs_){
                res.render('miesiac_nowy.jade', {title: 'Nowy', rokDoc : rokDoc, crumbs: crumbs_});
            });

        });
    });

    this.app.post('/rozliczacz/miesiac/nowy/:refrok', function(req, res){
           miesiacProvider.save(
            {
              nazwa     : req.param('nazwa'),
              refrok    : req.param('refrok'),
              odliczeniestawka  : req.param('odliczeniestawka'),
              datau     :   new Date(),
              datasort          : new Date()
            },
            function( error, docs) {
               res.redirect('/rozliczacz/miesiac/'+req.param('refrok'));
           });
    });


    this.app.get('/rozliczacz/miesiac/edytuj/:id', function(req, res){
        miesiacProvider.findById(req.params.id,
                function(error,doc){
                    var crumb = {
                                nazwa   : 'edycja dla ' + doc.nazwa,
                                link    : '/rozliczacz/miesiac/edytuj/',
                                id      : req.params.id
                            };
                    breadProvider.updateCrumbs(req.session.id, crumb, function(error, crumbs_){
                            res.render('miesiac_edycja.jade', {title: 'Edycja', param: doc , crumbs:crumbs_});
                    });

                });
    });

    this.app.post('/rozliczacz/miesiac/edytuj/:id', function(req, res){
           miesiacProvider.update(req.params.id,
            {
              nazwa     : req.param('nazwa'),
              //zuspodstawa     : req.param('zuspodstawa'),
              odliczeniestawka  : req.param('odliczeniestawka'),
              datam     : new Date()
            },
            function( error, docs) {
               //
               miesiacProvider.findById(req.params.id,
                function(error,doc){
                        res.redirect('/rozliczacz/miesiac/'+ doc.refrok);
                });
           });
    });

    this.app.get('/rozliczacz/miesiac/drukuj/:id', function(req, res){
        //need rok
        miesiacProvider.findById(req.params.id, function(error, mies_doc){

              miesiacProvider.findByRok(mies_doc.refrok, function(error, miesCollection){
              var miesIdArr = [];
              for (var miesId in miesCollection)
                    miesIdArr.push(miesCollection[miesId]._id.toHexString());

              wpisProvider.findbyMiesIn(miesIdArr, function (error,wpisDoc){
                var pos = 0;
                for (var wpisId in wpisDoc){
                    if( wpisDoc[wpisId].refmiesiac == req.params.id)
                        break;
                    else
                        pos++;
                }

                wpisSchematProvider.findByRok(mies_doc.refrok, function(error, wpisSchematDoc){

                    wpisProvider.findbyMiesReverseSort(req.params.id, function(error,doc){
                        var sumap = 0;
                        var sumaw = 0;

                        for(var wpisId in doc){

                            //odliczenie vat
                            var wpisElem = doc[wpisId]
                            var vo = +(wpisElem.vatodliczenie);

                            var pcena = parseLocalNum(wpisElem.cena);
                            wpisElem.cena = ( vo > 0 ? +(pcena) + +((wpisElem.vatstawka * pcena) *(1- vo)) : +(pcena));


                            var refschemat = doc[wpisId].refschemat;
                            for(var schematId in wpisSchematDoc){
                                if(wpisSchematDoc[schematId]._id == refschemat){
                                    doc[wpisId].schematTyp = wpisSchematDoc[schematId].typ;
                                    if(doc[wpisId].schematTyp > 0)
                                        sumap += parseLocalNum(doc[wpisId].cena);
                                    else
                                        sumaw += parseLocalNum(doc[wpisId].cena);
                                    break;
                                }
                            }
                        }

                        res.render('miesiac_drukowanie.jade', {title: 'Drukowanie', param: doc, prev_id_count: pos, sumap: sumap.toFixed(2), sumaw: sumaw.toFixed(2), miesiac: mies_doc.nazwa });
                    });

                  });
              });

              });
        });
    });


    this.app.get('/rozliczacz/miesiac/jpk_vat/:id', function(req, res){
        //need rok
        miesiacProvider.findById(req.params.id, function(error, mies_doc){

              miesiacProvider.findByRok(mies_doc.refrok, function(error, miesCollection){
              var miesIdArr = [];
              for (var miesId in miesCollection)
                    miesIdArr.push(miesCollection[miesId]._id.toHexString());

              wpisProvider.findbyMiesIn(miesIdArr, function (error,wpisDoc){

                var pos = 0;
                for (var wpisId in wpisDoc){
                    if( wpisDoc[wpisId].refmiesiac == req.params.id)
                        break;
                    else
                        pos++;
                }

                //wpis_schemat set typ -1 or 1
                wpisSchematProvider.findByRok(mies_doc.refrok, function(error, wpisSchematDoc){

                    wpisProvider.findbyMiesReverseSort(req.params.id, function(error,doc){

                        //console.log("this is orginal doc");
                        //console.log(doc);

                        var sumaPVat = 0;
                        var sumaWVat = 0;

                        for(var wpisId in doc){

                            console.log("wpis id " + wpisId);
                            //odliczenie vat
                            var wpisElem = doc[wpisId]
                            var vo = +(wpisElem.vatodliczenie);

                            var pCena = parseLocalNum(wpisElem.cena);
                            var dolicz = 0;
                            if(vo > 0)
                              dolicz = +((wpisElem.vatstawka * pCena) * (1 - vo));

                            wpisElem.cena = pCena + dolicz;//dodaj polowe 50% vatu do netto
                            wpisElem.vat3 = (wpisElem.vatstawka * wpisElem.cena ).toFixed(2);

                            if(doc[wpisId].typ > 0)
                                sumaPVat  +=  parseLocalNum(doc[wpisId].vat3);
                            else
                                sumaWVat  +=  parseLocalNum(doc[wpisId].vat3);
                        }

                        var dt = new Date();
                        var biezDt = formatDateTime(dt);

                        // GET THE MONTH AND YEAR OF THE SELECTED DATE.
                        var month = dt.getMonth() - 1 ,
                            year = dt.getFullYear();

                        // GET THE FIRST AND LAST DATE OF THE MONTH.
                        var firstDay  = new Date(year, month, 1);
                        var lastDay   = new Date(year, month + 1, 0);

                        console.log("this is orginal doc");
                        console.log(doc);

                        res.render('miesiac_jpk_vat.jade',
                          {
                              param     : doc
                            , sumaPVat  : sumaPVat.toFixed(2)
                            , sumaWVat  : sumaWVat.toFixed(2)
                            , dataU     : biezDt
                            , dataOd    : formatDate(firstDay)
                            , dataDo    : formatDate(lastDay)
                          },  function(err, html) {
                                //boutify&save to file
                                console.log(html);

                                var pd = require('pretty-data').pd;
                                var jpk_vat_xml = pd.xml(html);
                                console.log('pretty-data');
                                console.log(jpk_vat_xml);

                                var fs = require('fs');

                                filePath = "jpk_vat_mies_" + firstDay.getMonth() + "_rok_" + year +  ".xml";
                                var stream = fs.createWriteStream(filePath);
                                stream.once('open', function(fd) {
                                  stream.write(jpk_vat_xml);
                                  stream.end();

                                  res.download(filePath);
                                });
                            }
                          );



                    });
                });
              });

              });
        });
    });



    /* perzemieszczanie */
    this.app.get('/rozliczacz/rok/do_gory/:id', function(req, res){
           rokProvider.itemSwitch(req.params.id, 'up',
                function(error,doc){
                        res.redirect('/rozliczacz/rok/');
            });
    });

    this.app.get('/rozliczacz/rok/do_dolu/:id', function(req, res){
           rokProvider.itemSwitch(req.params.id, 'down',
                function(error,doc){
                        res.redirect('/rozliczacz/rok/');
            });
    });

    this.app.post('/rozliczacz/relokuj', function(req, res){

            var type = req.body.type;
            switch(type){
                case "rok":
                    rokProvider.itemsSwitch(req.body.id, function(error,doc){});
                break;
                case "miesiac":
                    miesiacProvider.itemsSwitch(req.body.id, function(error,doc){});
                break;
                case "wpisSchemat":
                    wpisSchematProvider.itemsSwitch(req.body.id, function(error,doc){});
                break;
                case "wpis":
                    wpisProvider.itemsSwitch(req.body.id, function(error,doc){});
                break;
            }

    });




    this.app.get('/rozliczacz/wpis/do_gory/:id', function(req, res){
           wpisProvider.itemSwitch(req.params.id, 'up',
                function(error,doc){
                        res.redirect('/rozliczacz/wpis/'+ doc);
            });
    });

    this.app.get('/rozliczacz/wpis/do_dolu/:id', function(req, res){
           wpisProvider .itemSwitch(req.params.id, 'down',
                function(error,doc){
                        res.redirect('/rozliczacz/wpis/'+ doc);
            });
    });


    /* ksiazka - wpis*/

    var _ = require('underscore');

    this.app.get('/rozliczacz/wpis/nazwy', function(req, res){
        wpisProvider.getDistinctByName(req.query.param1, function(error, doc){
            res.jsonp(doc);
        });
    });

    this.app.get('/rozliczacz/wpis/ostatni_wpis', function(req, res){
        wpisProvider.getLastWpisbyName(req.query.param1, function(error, doc){
            res.jsonp(doc);
        });
    });

    this.app.get('/rozliczacz/wpis/:refmiesiac', function(req, res){

        miesiacProvider.findById(req.params.refmiesiac,function(error,miesDoc){
            wpisProvider.findbyMies(req.params.refmiesiac,
                function(error,doc){
                    var crumb = {
                                nazwa   : '' +  miesDoc.nazwa,
                                link    : '/rozliczacz/wpis/',
                                id      : req.params.refmiesiac
                            };

                //add nazwa schematu schematNazwa
                var ObjectID = require('mongodb').ObjectID;
                var refArr = []
                _.each(doc, function(elem){refArr.push( ObjectID(elem.refschemat));});
                wpisSchematProvider.findbyIdIn(refArr, function(error, schematDocArr){
                  _.each(doc, function(elem){
                      elem.schematNazwa = _.find(schematDocArr, function(sch) { return sch._id == elem.refschemat}).nazwa;
                  });

                  breadProvider.updateCrumbs(req.session.id, crumb, function(error, crumbs_){
                    res.render('wpis.jade', {title: 'Lista wpisów', params: doc, refmiesiac: req.params.refmiesiac, crumbs: crumbs_});
                  });
                });
              });
        });
    });


    this.app.get('/rozliczacz/wpis/nowy/:refmiesiac', function(req, res){
            var crumb = {
                                nazwa   : 'utwórz wpis',
                                link    : '/rozliczacz/wpis/nowy/',
                                id      : req.params.refmiesiac
                            };
            //czytaj refrok pozniej schemat.
            miesiacProvider.findById(req.params.refmiesiac,function(error,miesDoc){
                wpisSchematProvider.findByRok(miesDoc.refrok, function(error,doc){
                    //ustal date wejsciowa
                    wpisProvider.findbyMies(req.params.refmiesiac, function(error, wpisy_doc){
                        var dt = "";
                        if(wpisy_doc.length > 0)
                            dt  = wpisy_doc[wpisy_doc.length-1].data;
                        else{
                            dt = formatDate(new Date());
                        }

                        breadProvider.updateCrumbs(req.session.id, crumb, function(error, crumbs_){
                            res.render('wpis_nowy.jade', {title: 'Nowy', refmies : req.params.refmiesiac, crumbs: crumbs_, wpisy_schema: doc, data_init : dt});
                        });
                    });
                });
            });
    });

    this.app.post('/rozliczacz/wpis/nowy/:refmiesiac', function(req, res){

           wpisProvider.save(
            {
              nazwa : req.param('nazwa'),
              nip   : req.param('nip'),

              vatstawka   : req.param('vatstawka'),
              vatodliczenie   : req.param('vatodliczenie'),
              typ   : req.param('typ'),

              cena  : req.param('cena'),
              numer : req.param('numer'),
              adres : req.param('adres'),
              opis  : req.param('opis'),
              data  : req.param('data'), //'yy-mm-dd'
              refschemat : req.param('refschemat'),
              refmiesiac : req.param('refmiesiac'),
              datau : new Date(),
              datasort          : new Date()
            },
            function( error, docs) {
               res.redirect('/rozliczacz/wpis/'+req.param('refmiesiac'));
           });
    });

    this.app.get('/rozliczacz/wpis/edytuj/:id', function(req, res){
           wpisProvider.findById(req.params.id,
                function(error,doc){

                    var crumb = {
                                nazwa   : 'edytuj wpis',
                                link    : '/rozliczacz/wpis/edytuj/',
                                id      : req.params.id
                            };
                    miesiacProvider.findById(doc.refmiesiac,function(error,miesDoc){
                        wpisSchematProvider.findByRok(miesDoc.refrok, function(error,doc_wpis){

                            breadProvider.updateCrumbs(req.session.id, crumb, function(error, crumbs_){
                                res.render('wpis_edycja.jade', {title: 'Edycja', param: doc, crumbs : crumbs_, wpisy_schema: doc_wpis});
                            });
                        });
                    });
                });
    });

    this.app.post('/rozliczacz/wpis/edytuj/:id', function(req, res){
           wpisProvider.update(req.params.id,
            {
                nazwa       : req.param('nazwa'),
                nip   : req.param('nip'),

                vatstawka   : req.param('vatstawka'),
                vatodliczenie   : req.param('vatodliczenie'),
                typ   : req.param('typ'),

                cena        : req.param('cena'),
                numer : req.param('numer'),
                adres : req.param('adres'),
                opis  : req.param('opis'),
                data  : req.param('data'), //'yy-mm-dd'
                refschemat : req.param('refschemat'),
                datam : new Date()
            },
            function( error, docs) {
               res.redirect('/rozliczacz/wpis/' +req.param('refmiesiac'));
           });
    });



    /* rok podsumowanie */
    this.app.get('/rozliczacz/rok/podsumowanie/:id', function(req, res){
        var rok_id = req.params.id;
        var data = sumProvider.prepareData( rok_id, function( error, docs, name) {
            var crumb = {
                            nazwa   : 'podsumowanie dla ' + name, // + rokDoc.nazwa,
                            link    : '/rozliczacz/rok/podsumowanie/',
                            id      : rok_id
                        };
           // console.log(podatkiArr);

            breadProvider.updateCrumbs(req.session.id, crumb, function(error, crumbs_){
                res.render('podsumowanie.jade', {title: 'Pit', params: docs, crumbs : crumbs_});
            });
        })
    });




    this.app.get('/rozliczacz/rok/szukaj/:id', function(req, res){
        var rok_id = req.params.id;
        var crit = '';


        rokProvider.findById(rok_id,function(error,doc){
            var crumb = {
                        nazwa   : 'szukaj dla ' + doc.nazwa,
                        link    : '/rozliczacz/rok/szukaj/',
                        id      : rok_id
                    };

           console.log("******************************** Step1 ");
           // var wpisy_doc = {};
            wpisProvider.findByYear(rok_id, crit, function(error, wpisy_doc){
                    breadProvider.updateCrumbs(req.session.id, crumb, function(error, crumbs_){
                        console.log(wpisy_doc);
                        //count sum
                        var total_s = 0;
                        _.each(wpisy_doc, function(elem){
                            total_s += parseLocalNum(elem.cena);
                        });
                        console.log("******************************** Total sum "   + total_s);

                        res.render('rok_szukaj.jade', {title: 'Szukaj', crit: crit, params: doc, results: wpisy_doc, total_sum: total_s, crumbs : crumbs_});
                    });
            });
        });

    });

    this.app.post('/rozliczacz/rok/szukaj/:id', function(req, res){
        var rok_id  = req.param('id');
        var crit    = req.param('crit');

        rokProvider.findById(rok_id,function(error,doc){
            var crumb = {
                        nazwa   : 'szukaj dla ' + doc.nazwa,
                        link    : '/rozliczacz/rok/szukaj/',
                        id      : rok_id
                    };

           // var wpisy_doc = {};
            wpisProvider.findByYear(rok_id, crit, function(error, wpisy_doc){
                    breadProvider.updateCrumbs(req.session.id, crumb, function(error, crumbs_){
                        console.log(wpisy_doc);

                        //count sum
                        var total_s = 0;
                        _.each(wpisy_doc, function(elem){
                            total_s += parseLocalNum(elem.cena);
                        });

                        res.render('rok_szukaj.jade', {title: 'Szukaj', crit: crit, params: doc, results: wpisy_doc, total_sum: total_s, crumbs : crumbs_});
                    });
            });
        });

    });


    this.app.get("/rozliczacz/sesja_sprawdz", function(req, res){
    sesjaProvider.findBySession(req.session.id, function (error, doc){
           if(doc.length == 0){
                console.log("session NOT registered");
            }
            else{
                    debugger;
                    console.log("session is already registered");
            }
    });
    });

};


exports.RoutesProvider = RoutesProvider;
