Cloud_hw2
=========

Cloud computing and big data - Assignment 2

main_tweet.py -- Set up a cron job for every 15 mins or so to extract tweets from twitter and insert into mysql

main_queue.py -- set up a cron job for every 5 mins or so to read the amazon SQS queue and insert notification to the HTTP endpoint

hw2_webpage folder -- node.js web server with front end files.
 * ./hw2_all/app.js is the back end node.js server and route handlers, including SNS and websocket using socket.io
 * ./hw2_all/index.html is the templace with nav bar and AngularJS directives
 * ./hw2_all/angular/twittmap.js is the AngularJS file that creates the map content

using the twittmap: 
* use the button on the nav bar to toggle between maps
* the number in the buttons are number of tweets (fewer for sentiment analysis since we have sentiment on fewer of those). if you leave the page open you should see the numbers in the buttons increasing in real time and the map adding points in real time (harder to see than the numbers going up) 
* to see the sentiment heatmap, click a positive and/or negative sentiment and any number of keywords
# Twitter-Sentiment-Map

#Contributors:
Divyansh Agarwal
Prateek Goel
Priya Venkat
Josh Plotkin
