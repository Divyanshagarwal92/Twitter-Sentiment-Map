var temp;

(function(){

  var twittmap = angular.module('twittmap', ['btford.socket-io']);

  twittmap.factory('socket', function (socketFactory) {
  	return socketFactory();
  });

  twittmap.controller('MapController', function($scope){
  	$scope.mapType = false;

  	
  	$scope.toggle = function(){
  		console.log('hello');
  		if($scope.mapType == false){
  			$scope.mapType = true;
  		} else {
  			$scope.mapType = false;
  		}
  	};

  	$scope.getButtonDesc = function(){
  		if($scope.mapType === false){
  			return 'View Scatter Map';
  		} else {
  			return 'View Heatmap';
  		}
  	};


  	$scope.getStatus = function(){
  		return $scope.mapType;
  	};

  });

  twittmap.controller('DataController', function(socket, $scope){
      $scope.mapData = null;
      $scope.newData = null;

	  socket.on('pageload', function (socketData) {
	    $scope.mapData = socketData.originalData;
		$scope.scatterDone = false;
		$scope.heatDone = false;	    
	    console.log('initial data loaded');
	  });

	  socket.on('newdata', function(socketData){
	  	$scope.newData = socketData.newData;
	  	//console.log($scope.newData.length);
	  	//console.log($scope.mapData.length);

	        $scope.mapData = $scope.mapData.concat(socketData.newData);

		$scope.scatterDone = false;
		$scope.heatDone = false;	    
	  	console.log($scope.mapData.length);

	  });

  });

  twittmap.directive('scatterMap', function(){

  return {
  restrict: 'E',
  // require: '?DataController',
  terminal: true,
  link: function($scope, attrs){

  	var pointsTimer = setInterval(function(){
  		if($scope.mapData != null){
  			console.log('')
  			$('#Ebola').attr('value','poop');
  			clearInterval(pointsTimer);
  		}
  	},1000);

	var toggled = false;

	d3.select(window).on("resize", throttle);

	var zoom = d3.behavior.zoom()
	  .scaleExtent([1, 9])
	  .on("zoom", move);


	var width = document.getElementById('container').offsetWidth;
	var height = width / 2;

	var topo,projection,path,svg,g;

	var graticule = d3.geo.graticule();

	var tooltip = d3.select("#container").append("div").attr("class", "tooltip hidden");

	setup(width,height);

	function setup(width,height){
	projection = d3.geo.mercator()
	  .translate([(width/2), (height/2)])
	  .scale( width / 2 / Math.PI);

	path = d3.geo.path().projection(projection);

	svg = d3.select("#container").append("svg")
	    .attr("width", width)
	    .attr("height", height)
	    .call(zoom)
	    .on("click", click)
	    .append("g");

	g = svg.append("g");
	}



	d3.json("js/world-topo-min.json", function(error, world) {
	var countries = topojson.feature(world, world.objects.countries).features;
	topo = countries;
	draw(topo);
	});


	function draw(topo) {

	svg.append("path")
	   .datum(graticule)
	   .attr("class", "graticule")
	   .attr("d", path);


	g.append("path")
	 .datum({type: "LineString", coordinates: [[-180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]]})
	 .attr("class", "equator")
	 .attr("d", path);


	var country = g.selectAll(".country").data(topo);

	country.enter().insert("path")
	    .attr("class", "country")
	    .attr("d", path)
	    .attr("id", function(d,i) { return d.id; })
	    .attr("title", function(d,i) { return d.properties.name; })
	    .style("fill", function(d, i) { return d.properties.color; })
	    .attr('opacity',.25);

	//offsets for tooltips
	var offsetL = document.getElementById('container').offsetLeft+20;
	var offsetT = document.getElementById('container').offsetTop+10;

	//tooltips
	country
	  .on("mousemove", function(d,i) {

	    var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );

	    tooltip.classed("hidden", false)
	           .attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
	           .html(d.properties.name);

	    })
	    .on("mouseout",  function(d,i) {
	      tooltip.classed("hidden", true);
	    }); 
	}



	function redraw() {
	width = document.getElementById('container').offsetWidth;
	height = width / 2;
	d3.select('svg').remove();
	setup(width,height);
	draw(topo);
	}


	function move() {

	var t = d3.event.translate;
	var s = d3.event.scale; 
	zscale = s;
	var h = height/4;


	t[0] = Math.min(
	  (width/height)  * (s - 1), 
	  Math.max( width * (1 - s), t[0] )
	);

	t[1] = Math.min(
	  h * (s - 1) + h * s, 
	  Math.max(height  * (1 - s) - h * s, t[1])
	);

	zoom.translate(t);
	g.attr("transform", "translate(" + t + ")scale(" + s + ")");

	//adjust the country hover stroke width based on zoom level
	d3.selectAll(".country").style("stroke-width", 1.5 / s);

	}

	var throttleTimer;
	function throttle() {
	window.clearTimeout(throttleTimer);
	  throttleTimer = window.setTimeout(function() {
	    redraw();
	  }, 200);
	}

	//geo translation on mouse click in map
	function click() {
  	  var latlon = projection.invert(d3.mouse(this));
	};

	var ebola = false, 
	ottawa = false, 
	aws = false,
	heroku = false,
	nadella = false;

	var buttons = {
		ebola : [ebola, 'btn btn-primary', '#Ebola', '#2d6ca2','Ebola '],
		ottawa : [ottawa, 'btn btn-warning', '#Ottawa', '#eb9316','Ottawa '],
		aws : [aws, 'btn btn-success', '#AWS', '#4daf4a', 'AWS '],
		heroku : [heroku, 'btn btn-info', '#Heroku', '#2aabd2', 'Heroku '],
		nadella : [nadella, 'btn btn-danger', '#Nadella', '#c12e2a', 'Nadella ']
	};

	// CHANGE BUTTON COLORS AND TOGGLE DATA POINTS
	Object.keys(buttons).forEach(function(keyword) {
	d3.select(buttons[keyword][2]).on('click', function() {
	    if (buttons[keyword][0] === false){
	      addPoints(keyword, buttons[keyword][3]);
	      buttons[keyword][0] = true;
	      d3.select(buttons[keyword][2]).attr('class', buttons[keyword][1])
	    } else {
	      removePoints(keyword);
	      buttons[keyword][0] = false;
	      d3.select(buttons[keyword][2]).attr('class','btn btn-default')      
	    }
		});
	});

	// COUNTS ON BUTTONS:
	function btnCounts(keyword){
		var counts = $scope.mapData.filter(function(obj) {
		    return (obj.search_string === keyword);
		});
		$(buttons[keyword][2]).text(buttons[keyword][4] + '(' + counts.length + ')');
	}

	// Initialize Buttons //////////////////////////
	var initialTimer = setInterval(function(){
	  if ($scope.mapData != null){
		Object.keys(buttons).forEach(function(keyword) {
			btnCounts(keyword);
		});
	  clearInterval(initialTimer);
	  }
	}, 500);


	// ADD NEW DATA ////////////////////////////////
	var newDataTimer = setInterval(function(){
	  if ($scope.newData != null && $scope.scatterDone == false){
	  	console.log('ready!');
		Object.keys(buttons).forEach(function(keyword) {
			btnCounts(keyword);
			if(buttons[keyword][0] === true){
				addPoints(keyword, buttons[keyword][3]);
			}
		});
	  $scope.scatterDone = true;
	  }
	}, 500);
	///////////////////////////////////////////////


    // SHOW POINTS /////////////////////////
    ///////////////////////////////////////////
    // TODO: find a more elegant way to wait for data to load
    function addPoints(word, color){
	    var timer = setInterval(function(){
		    if($scope.mapData == null){
		     		; // no nothing	
		    } else {

				temp = $scope.mapData;

				keywordData = $scope.mapData.filter(function(obj) {
				    return (obj.search_string === word);
				});

			      g.selectAll(word)
			      .data(keywordData)
			       // .transition()
			       // .duration(1000)
			       .enter()
			       .append('circle')
			       .attr('class', word)
			       .attr('cx', function(d){
			          return projection([d.longitude,d.latitude])[0];
			       })
			       .attr('cy', function(d){
			          return projection([d.longitude,d.latitude])[1];
			       })
			       .attr('fill', color)
			       .attr('opacity', .5)
			       .attr("r", 1.5);

			       // found data. don't add redundant data
			       clearInterval(timer);
		    } 

		}, 1000);

	}
	///////////////////////////////////////////
	function removePoints(word){
		g.selectAll('.' + word)
		.transition()
		.duration(1000)
		.attr('opacity',0);
	}
	///////////////////////////////////////////

///// end of scatter map
  }
}
});



twittmap.directive('heatMap', function(){

return {
restrict: 'E',
// require: '?DataController',
terminal: true,
link: function($scope, attrs){


// BUTTON TOGGLE CONTROLS
var ebola = false, 
ottawa = false, 
aws = false,
heroku = false,
nadella = false;

var buttons = {
	ebola : [ebola, 'btn btn-primary', '#EbolaHeat', '#2d6ca2','Ebola '],
	ottawa : [ottawa, 'btn btn-warning', '#OttawaHeat', '#eb9316','Ottawa '],
	aws : [aws, 'btn btn-success', '#AWSHeat', '#4daf4a', 'AWS '],
	heroku : [heroku, 'btn btn-info', '#HerokuHeat', '#2aabd2', 'Heroku '],
	nadella : [nadella, 'btn btn-danger', '#NadellaHeat', '#c12e2a', 'Nadella ']
};
/////////////////////////////////////////
var positive = false,
negative = false;

var sentiment = {
	positive : [false, 'btn btn-success', '#posSentiment', '#4daf4a','Positive Sentiment'],
	negative : [false, 'btn btn-danger', '#negSentiment', '#c12e2a','Negative Sentiment']
};

Object.keys(sentiment).forEach(function(keyword) {
d3.select(sentiment[keyword][2]).on('click', function() {
    if (sentiment[keyword][0] === false){
      sentiment[keyword][0] = true;
      console.log(sentiment[keyword][0])
      d3.select(sentiment[keyword][2]).attr('class', sentiment[keyword][1])
      togglePoints();
    } else {
      sentiment[keyword][0] = false;
      d3.select(sentiment[keyword][2]).attr('class','btn btn-default')      
      togglePoints();
    }
	});
});



// COUNTS ON BUTTONS:
function btnCounts(){
	console.log($scope.mapData);

	Object.keys(buttons).forEach(function(keyword) {
		var counts = $scope.mapData.filter(function(obj) {
		    return (obj.search_string === keyword && (obj.polarity_score != null && obj.polarity_score != 0));
		});
		$(buttons[keyword][2]).text(buttons[keyword][4] + '(' + counts.length + ')');
	});
}

// INITIALIZE BUTTON COUNTS WHEN DATA IS READY
var initBtnCounts = setInterval(function(){
	if($scope.mapData != null){
		btnCounts();
		clearInterval(initBtnCounts);
	}
}, 1000);


var map, tiles, pos, neg;
function drawMap(){
	map = L.map('map').setView([40, -50], 3);
	tiles = L.tileLayer('http://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
	    attribution: '<a href="https://www.mapbox.com/about/maps/">Terms and Feedback</a>',
	    id: 'examples.map-20v6611k'
	}).addTo(map);

	pos = L.heatLayer([0,0],
		{
        radius: 5,
        blur: 15, 
        maxZoom: 7,
        gradient: {0.2: '#f7fcf5', 0.65: '#005a32'},
    }).addTo(map);	

	neg = L.heatLayer([0,0],
		{
        radius: 5,
        blur: 15, 
        maxZoom: 7,
        gradient: {0.2: '#ffffcc', 0.65: '#b10026'},
    }).addTo(map);	    
}

drawMap();


// // CHANGE BUTTON COLORS AND TOGGLE DATA POINTS
Object.keys(buttons).forEach(function(keyword) {
d3.select(buttons[keyword][2]).on('click', function() {
    if (buttons[keyword][0] === false){
      buttons[keyword][0] = true;
      d3.select(buttons[keyword][2]).attr('class', 'btn btn-primary')
      togglePoints();
    } else {
      buttons[keyword][0] = false;
      d3.select(buttons[keyword][2]).attr('class','btn btn-default')      
      togglePoints();
    }
	});
});

function togglePoints(){
	var waitToggle = setInterval(function(){
		if($scope.mapData != null){

			var kwOn = []
			Object.keys(buttons).forEach(function(kw){
				if(buttons[kw][0] == true){
					kwOn.push(kw);
				}
			});

			console.log(kwOn);

			pos.setLatLngs([]);
			neg.setLatLngs([]);

			var posFilter = [];
			var negFilter = [];
			kwOn.forEach(function(k){
				var posCounts = $scope.mapData.filter(function(obj) {
				    return (obj.search_string == k && obj.polarity_score > 0 && sentiment.positive[0]);
				});

				var negCounts = $scope.mapData.filter(function(obj) {
				    return (obj.search_string == k && obj.polarity_score < 0 && sentiment.negative[0]);
				});

				console.log(sentiment.positive[0], sentiment.negative[0]);
				console.log('counts ' + posCounts.length, negCounts.length);

				posCounts.forEach(function(c){
					posFilter.push([c.latitude,c.longitude])
				});
				console.log(posFilter.length);

				negCounts.forEach(function(c){
					negFilter.push([c.latitude,c.longitude])
				});
				console.log(negFilter.length);
			});

			pos.setLatLngs(posFilter);
			neg.setLatLngs(negFilter);
			clearInterval(waitToggle);
		}
	}, 1000);
}

// UPDATE POINTS WITH NEW DATA
var newDataTimer = setInterval(function(){
	if($scope.newData != null && $scope.heatDone == false){
		btnCounts();
		togglePoints();
		$scope.heatDone = true;
	}
}, 1000);


// end of heatmap
}}});


})();
