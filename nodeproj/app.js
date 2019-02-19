var express = require('express')
  , https = require('https')
  , http = require('http')
  , path = require('path')
  , redis   = require("redis")
  , fs = require('fs')
  //, spdy = require('spdy')
  , nconf = require('nconf');


nconf.argv()
       .env()
       .file({ file: 'config.json' });



var RedisStore = require('connect-redis')(express);
var app = express();

app.configure(function(){

  app.set('port', process.env.PORT || nconf.get('app:port'));
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');

  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.methodOverride());
  
  var redis_options = {
    client    : redis.createClient(),
    host      : nconf.get('redis:host'),
    port      : nconf.get('redis:port') 
  };
  
  console.log("noption is: " + nconf.get('redis:host'));


  app.use(
            express.session({ store: new RedisStore(redis_options), secret: 'keycboard_cat'}));
  
  
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.errorHandler());
});

/*
var speedy_options = {
  key: fs.readFileSync('keys/spdy-key.pem'),
  cert: fs.readFileSync('keys/spdy-cert.pem')
};
*/
/*
if(nconf.get('app:use_cluster')){
    console.log("using cluster");
    
    var cluster = require('cluster');
    var numCPUs = require('os').cpus().length;
    if (cluster.isMaster) {
      // Fork workers.
      for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
      }
     
       cluster.on('exit', function(worker, code, signal) {
        console.log('worker ' + worker.process.pid + ' died');
      });
    } else {
        // Workers can share any TCP connection
        // In this case its a HTTP server
        http.createServer(speedy_options, app).listen(app.get('port'), function(){
            console.log("Cluster Express server listening on port " + app.get('port'));
        });
    }
}
else{
    http.createServer(app).listen(app.get('port'), function(){
            console.log("Express server listening on port " + app.get('port'));
        });
}
*/

http.createServer(app).listen(app.get('port'), function(){
            console.log("Express server listening on port " + app.get('port'));
        });


console.log( "****************** This is env ************* : " + nconf.get('env'));  

var RoutesProvider = require('./providers/routesProvider').RoutesProvider;
var routesProvider = new RoutesProvider(app, nconf);
debugger;

routesProvider.getRoutes();

