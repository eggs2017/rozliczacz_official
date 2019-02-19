// load the auth variables
var configAuth = require('./auth');

var passport = require('passport');

passport.serializeUser(function(user, callback){
        console.log('serializing user.');
        callback(null, user);
    });

    passport.deserializeUser(function(user, callback){
       console.log('deserialize user.');
       callback(null, user);
    });

    var processRequest = function(token, refreshToken, profile, callback){
        process.nextTick(function(){
           console.log('id : '+ profile.id);
           console.log('name :'+ profile.displayName);
           console.log('email :' + profile.emails);
           console.log('token : '+ token);
        });
    };

    passport.use(new GoogleStrategy({
        clientID: configAuth.clientID,
        clientSecret : configAuth.clientSecret,
        callbackURL : configAuth.callbackURL,
        realm : configAuth.realm
    }, processRequest));