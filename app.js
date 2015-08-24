
var express = require('express');
var redis = require('redis');
var url = require('url');
var moment = require('moment');
var request = require('request');
var _ = require('underscore');
var Path = require('path');
var fs = require('fs');


//var aprsName = 'OZ2CLJ-11';
var aprsName = 'OZ2CLJ-11';

var grawFilePath = process.env.GRAW_PATH || '../files/';


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

app.get('/graw', function(request, response) {
  client.get('grawData', function(err,d){
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

            path = _.filter(path, function(p){
              return moment.unix(p.time).isAfter(moment().subtract(10,'hours'))
            })

            console.log(path.length);

            client.set('aprsPath',JSON.stringify(path));
          }

        })





      }
     // console.log(info);

    }
  }

  request(options, callback);
}

var grawNumLinesLast = 0;
var parseGraw = function(){
  var files = fs.readdirSync(Path.join(__dirname, grawFilePath));
  files.sort();
  var file = _.last(files);
  var content = fs.readFileSync(Path.join(__dirname, grawFilePath,file)).toString();
  console.log(file);
  var lines = content.split('\n');
  console.log(lines.length);

  if(grawNumLinesLast != lines.length){
    grawNumLinesLast = lines.length;

    console.log("Parse");

    var startTime = lines[0].match(/Start time: (\d\d:\d\d:\d\d)/i)[1];
    startTime = moment(startTime, 'HH:mm:ss').add(2,'hours');
    console.log(startTime.format());

    var dataLines = _.rest(lines,9);
    var grawData = [];

    _.forEach(dataLines,function(l){
      var match = l.match(/^(\d?\d\d:\d\d)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)/i)
      if(match){
        console.log("00:" + match[1],moment.duration("00:" + match[1]).humanize());
        grawData.push({
          time: startTime.clone().add(moment.duration("00:"+match[1])).format('X'),
          tryk: parseFloat(match[2]),
          temp: parseFloat(match[3]),
          fugtighed: parseFloat(match[4]),
          windspeed: parseFloat(match[5]),
          winddir: parseFloat(match[6]),
          lon: parseFloat(match[7]),
          lat: parseFloat(match[8]),
          altitude: parseFloat(match[9])
        })
      }
    })
    client.set('grawData',JSON.stringify(grawData));

    console.log(grawData);



  }
}

fetchAprs();
setInterval(fetchAprs, 60000);

parseGraw();
setInterval(parseGraw,5000);
