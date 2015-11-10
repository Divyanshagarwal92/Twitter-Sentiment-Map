var AWS = require('aws-sdk'); 
var SNSClient = require('aws-snsclient');
require('ofe').call();

var q = {
  ebola: 0,
  ottawa: 0,
  aws: 0,
  heroku: 0,
  nadella: 0
};

//var client;
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

app.use(express.static(__dirname + '/public'));

io.sockets.on('connection', function (socket) {
    console.log('connected');

    // max tweet id for each search string   
    var connectionQMax = {
      ebola: 0,
      ottawa: 0,
      aws: 0,
      heroku: 0,
      nadella: 0
    };


  // INITIAL PAGE LOAD
    var dataPoints = [];
    connection.query("select search_string, longitude, latitude, polarity_score from tweets.tweets", function(err, rows, fields) {
      if (err) throw err;
      for(var i = 0; i < rows.length; i++){
        dataPoints.push(rows[i])
      }

      // get max id_str for each search term
      connection.query("select search_string,max(id_str) as idmax from tweets.tweets where polarity_score is not null and search_string in ('nadella','aws','heroku','ebola','ottawa') group by search_string order by search_string", function(err, rows2, fields2){
      	
      connectionQMax.aws = rows2[0].idmax;
      connectionQMax.ebola = rows2[1].idmax;      
      connectionQMax.heroku = rows2[2].idmax;
      connectionQMax.nadella = rows2[3].idmax;
      connectionQMax.ottawa = rows2[4].idmax;

      console.log('sending ' + dataPoints.length + ' points');
      io.sockets.emit('pageload', 
      { 'originalData' : dataPoints });
    }); // inner query end
    }); // outer query end
    
    //////////////////////
    //var changed, newdata;
    setInterval(function(){
	var changed = false, dataPoints = []; // , newdata = [];

	if(q.aws > connectionQMax.aws || q.heroku > connectionQMax.heroku || q.nadella > connectionQMax.nadella || q.ebola > connectionQMax.ebola || q.ottawa > connectionQMax.ottawa){ 
	   changed = true;
	}

	if(changed === true){
	   changed = false; // reset to false to keep searching for data after
	   var newDataQuery = "select search_string, longitude, latitude, polarity_score from tweets.tweets where (search_string = 'aws' and id_str > " + connectionQMax.aws + " or search_string = 'ebola' and id_str > " + connectionQMax.ebola + " or search_string = 'heroku' and id_str > " + connectionQMax.heroku + " or search_string = 'nadella' and id_str > " + connectionQMax.nadella + " or search_string = 'ottawa' and id_str > " + connectionQMax.ottawa + ')';

	console.log(newDataQuery);
	   connection.query(newDataQuery, function(err, rows, fields){
		if (err) throw err;
		// set new max id strings

		if (q.aws != 0)
		   connectionQMax.aws = q.aws;
		if (q.heroku != 0)
		   connectionQMax.heroku = q.heroku;
		if (q.ottawa != 0)
		   connectionQMax.ottawa = q.ottawa;
		if (q.ebola != 0)
		   connectionQMax.ebola = q.ebola;
		if (q.nadella != 0)
		   connectionQMax.nadella = q.nadella;
	        
		console.log('here');
		console.log('new: ' + rows.length);
		for(var i = 0; i < rows.length; i++){
		    console.log(dataPoints);
		    dataPoints.push(rows[i]);
		}

		console.log(dataPoints.length);

      		io.sockets.emit('newdata', 
      		{ 'newData' : dataPoints
      		});
	   });
	}
    }, 1000);
});

    //////////////////////
// SET THE GLOBAL MAXIMUM FOR TWEET IDs BY SEARCH TERM
app.post('/sns', SNSClient({verify: false}, function(err, message) {
	var x = JSON.parse(message.Message);
	 q[x[0].search_term] = x[0].id;
})
);


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

console.log("Express server listening on port 3000");
