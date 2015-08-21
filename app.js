
var express = require('express');
var redis = require('redis');
var url = require('url');

var redisURL = url.parse(process.env.REDIS_URL);
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


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});