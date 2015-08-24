
var express = require('express');
var redis = require('redis');
var url = require('url');
var moment = require('moment');
var request = require('request');
var _ = require('underscore');


//var aprsName = 'OZ2CLJ-11';
var aprsName = 'SQ5AM-11';


var redisURL = url.parse(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
var client = redis.createClient(redisURL.port, redisURL.hostname);
if(redisURL.auth) {
  client.auth(redisURL.auth.split(":")[1]);
}


client.get('startup', function(err,d){
  console.log("Last startup: ",d);
})
client.set('startup',new Date());


var app = express();


app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/Visualizer'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('index.html');
});

app.get('/startup', function(request, response) {
  client.get('startup', function(err,d){
    response.send(d);
  })
});

app.get('/aprs', function(request, response) {
  client.get('aprsPath', function(err,d){
    response.send(d);
  })
});


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

var fetchAprs = function() {

  var options = {
    url: 'http://api.aprs.fi/api/get?apikey=78629.UvwKIyJM4Mz3W&name='+aprsName+'&format=json&what=loc',
    headers: {
      'User-Agent': 'request'
    }
  };

  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      var info = JSON.parse(body);
      console.log(info);
      if(info.entries){

        client.get('aprsPath', function(err,d){
          var path= [];
          if(d){
            path = JSON.parse(d);
          }

          console.log(info);
          var lastTimeUnix = parseInt(info.entries[0].lasttime);
          var lastTime = moment.unix(lastTimeUnix);

          if(path.length == 0 || _.last(path).time != lastTimeUnix){
            path.push({
              time: lastTimeUnix,
              lat: parseFloat(info.entries[0].lat),
              lng: parseFloat(info.entries[0].lng),
              altitude: parseFloat(info.entries[0].altitude),
              speed: parseFloat(info.entries[0].speed),
              name: info.entries[0].name
            })

            client.set('aprsPath',JSON.stringify(path));
          }

        })





      }
     // console.log(info);

    }
  }

  request(options, callback);
}

fetchAprs();
setInterval(fetchAprs, 60000);
