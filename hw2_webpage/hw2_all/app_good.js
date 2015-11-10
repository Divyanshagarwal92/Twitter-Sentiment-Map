var AWS = require('aws-sdk'); 
var AWS = require('aws-snsclient'); 

// connect to db ///////////////////////////////////////
var mysql = require('mysql');
var dbParams = {
      host     : 'twittmap.ct78jelemnjv.us-east-1.rds.amazonaws.com',
      user     : 'ebroot',
      password : 'JoshPriya9'
      ,port        :  3306
    };
var connection = mysql.createConnection(dbParams);
connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
});
//////////////////////////////////////////////


var express = require('express')
  // , routes = require('./routes')
  , http = require('http');

var app = express();
var server = app.listen(3000);

// this tells socket.io to use our express server
var io = require('socket.io').listen(server); 

// app.configure(function(){
  // app.set('views', __dirname + '/views');
  // app.set('view engine', 'jade');
//   app.use(express.favicon());
//   app.use(express.logger('dev'));
//   app.use(express.static(__dirname + '/public'));
//   app.use(express.bodyParser());
//   app.use(express.methodOverride());
//   app.use(app.router);
// });

// app.configure('development', function(){
//   app.use(express.errorHandler());
// });

app.use(express.static(__dirname + '/public'));

io.sockets.on('connection', function (socket) {
    console.log('connected');
    // INITIAL PAGE LOAD
    var dataPoints = [];
    connection.query("select * from tweets.tweets where created_at > 'Tue'", function(err, rows, fields) {
      if (err) throw err;
      for(var i = 0; i < rows.length; i++){
        dataPoints.push(rows[i])
      }

      console.log('sending ' + dataPoints.length + ' points')
      io.sockets.emit('pageload', 
      { 'originalData' : dataPoints
      });
    });
    //////////////////////

    // APPEND NEW DATA
    setTimeout(function(){
        connection.query("select * from tweets.tweets where created_at <= 'Tue'", function(err, rows, fields) {
            if (err) throw err;
            var newPoints = [];
            for(var i = 0; i < rows.length; i++){
              newPoints.push(rows[i])
            }

            io.sockets.emit('newdata', 
            { 'newData' : newPoints
            , 'originalData' : dataPoints.concat(newPoints)
            });
        });
    }, 5000);
    //////////////////////
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

console.log("Express server listening on port 3000");
