var express = require('express');
var app = express.createServer();
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({secret:'mySecret'}));
 app.use(app.router);
//app.use(express.csrf());

// app.use(function(req, res, next){
//  res.locals.csrftoken = req.session._csrf;
//  next();
// });


 app.use(function(req, res, next) {
    res.locals.session = req.session;
    console.log('local session' + req.session);
    next();
  });
  
app.get('/',function(req,res){

    //req.session.user = req.query.username;

    // req.session.regenerate(function (err) {
    //    req.session.user = req.query.username;
    // });


    //console.log('Got client login : '+req.query.username);
    res.send('token='+req.session.id);

    // var body = 'Hello='+req.session._csrf;
    // res.setHeader('Content-Type', 'text/plain');
    // res.setHeader('Content-Length', body.length);
    // res.end(body);

});


app.listen(9001);
console.log('listen to 9001...');
