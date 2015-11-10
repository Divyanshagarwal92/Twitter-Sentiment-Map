#!/usr/bin/python
import boto.sqs
import pymysql
import time
from alchemyapi_python.alchemyapi import AlchemyAPI

alchemyapi = AlchemyAPI()

wait_time = 5;	#Seconds to wait before doing another read
read_num = 1;	#Number of messages to read at once

def get_tweets_from_db(startID, endID,conn,cur):
#Using a range of tweetIDs, fetches tweets from MySQL database
	tweets = [];

	#Run query using the start and end IDs
	sql_query = "SELECT ID_str, text FROM tweets";
	#print sql_query;
	cur.execute(sql_query);
	out = cur.fetchall();
	print len(out);
	for item in out:
		try:
			templs = [item[0].encode('ascii'), item[1].encode('ascii')];
			tweets.append(templs);	
		except (AttributeError,UnicodeEncodeError):
			continue;

	#Return tweet IDs and text in a list
	return tweets;	

def sentiment_analysis(tweetls):
	#tweetls is a list of tuples of the form (ID, text)
	#Outputs a list of tuples of the form (ID, text, polarity, polarity_score)
	k = 0;
	sent_tweets = []
	for tweet in tweetls:
		response = alchemyapi.sentiment("text", tweet[1])
		#print tweet[1];
		try:
			type = response["docSentiment"]["type"]
		except KeyError:
			continue;
		
		if type.encode('ascii') == 'neutral':
			sent_tweets.append([ type, 0.0 ])
		else:
			sent_tweets.append([ type, response["docSentiment"]["score"] ])
		k = k+1;
	return sent_tweets

def update_tweets_in_db(tweets, analyzed_tweets,conn,cur):
#Updates tweets in MySQL database with the sentiment analysis output

	#SQL query to update tweet with the sentiment analysis output 
	for i in range(0,len(tweets)):
		polarity = analyzed_tweets[i][0].encode('ascii');	
		polarity_score = analyzed_tweets[i][1];	
		update_query = "UPDATE tweets SET polarity=\'" + polarity + "\', polarity_score=" + str(polarity_score) + " WHERE ID_str=" + tweets[i][0];
		#print update_query;
		cur.execute(update_query);
		conn.commit();
	
#	return 1;

def process_msg(m,conn,cur):
#Processes a message starting with fetching tweets, running sentiment analysis and updating DB with sentiment analysis output

	#Read starting ID and end ID from message m
#	IDRange = m.split();
#	print "Range of tweet IDs : [ " + IDRange[1] + " , " + IDRange[0] + " ]";
	
	#Fetch tweets from SQL database
	#tweets = get_tweets_from_db(IDRange[1], IDRange[0]);
	tweets = get_tweets_from_db('', '',conn,cur);
	print "Number of tweets : ", len(tweets);	
	
	#Run sentiment analysis on tweets
	analyzed_tweets = sentiment_analysis(tweets);
	
	#Write sentiment analysis output back to DB
	update_tweets_in_db(tweets, analyzed_tweets,conn,cur);

#	return 1;

#def sentiment_main(sqs_queue,conn,cur):
#	while(True):
#		rs = sqs_queue.get_messages(read_num);
#		print "Message length : " + str(len(rs));
#		if len(rs) > 0:
#			m = rs[0];	
#			process_msg(m.get_body(),conn,cur);
#			#TODO : send message m to server
#		time.sleep(wait_time);	
