#!/usr/bin/python
import boto.sqs
import pymysql
import time
from alchemyapi_python.alchemyapi import AlchemyAPI

alchemyapi = AlchemyAPI()

wait_time = 5;	#Seconds to wait before doing another read
read_num = 1;	#Number of messages to read at once

def get_tweets_from_db( q, startID, endID,conn,cur):
#Using a range of tweetIDs, fetches tweets from MySQL database
	tweets = [];

	#Run query using the start and end IDs
	#sql_query = "SELECT ID_str, text FROM tweets WHERE ID_str >= " + startID + " AND ID_str <= " + endID;
	sql_query = "SELECT ID_str, text FROM tweets WHERE ID_str >= " + startID + " AND ID_str <= " + endID + " AND search_string = '" + q + "'";
	print sql_query;
	cur.execute(sql_query);
	out = cur.fetchall();

	for item in out:
		if item[0] == '':
			continue;
		templs = [item[0], item[1]];
		tweets.append(templs);	
#	print tweets
	#Return tweet IDs and text in a list
	return tweets;	

def sentiment_analysis(tweetls):
	#tweetls is a list of tuples of the form (ID, text)
	#Outputs a list of tuples of the form (ID, text, polarity, polarity_score)

	sent_tweets = []
	for tweet in tweetls:
		response = alchemyapi.sentiment("text", tweet[1])
		if response['status'] == 'ERROR':
			if response['statusInfo'] == 'daily-transaction-limit-exceeded':
				error_msg = 'daily-transaction-limit-exceeded'
				return error_msg
			else:	
				sent_tweets.append([ 'unknown', 0.0 ])
				continue

		type = response["docSentiment"]["type"]
		
		if type.encode('ascii') == 'neutral':
			sent_tweets.append([ type, 0.0 ])
		else:
			sent_tweets.append([ type, response["docSentiment"]["score"] ])

	return sent_tweets

def update_tweets_in_db(tweets, analyzed_tweets,conn,cur):
#Updates tweets in MySQL database with the sentiment analysis output

	#SQL query to update tweet with the sentiment analysis output 
	for i in range(0,len(tweets)):
		polarity = analyzed_tweets[i][0].encode('ascii');	
		polarity_score = analyzed_tweets[i][1];	
		update_query = "UPDATE tweets SET polarity=\'" + polarity + "\', polarity_score=" + str(polarity_score) + " WHERE ID_str=" + tweets[i][0];
		print update_query;
		cur.execute(update_query);
		conn.commit();
	
#	return 1;

def process_msg(m,conn,cur):
#Processes a message starting with fetching tweets, running sentiment analysis and updating DB with sentiment analysis output

	#Read starting ID and end ID from message m
	IDRange = m.split('|');
	print "In process_msg, Message: " + m;
	print "Range of tweet IDs : [ " + IDRange[1] + " , " + IDRange[0] + " ]";
	
	#Fetch tweets from SQL database
	#tweets = get_tweets_from_db(IDRange[1], IDRange[0]);
	tweets = get_tweets_from_db(IDRange[2], IDRange[0], IDRange[1],conn,cur);
	print "Number of tweets : ", len(tweets);	
	
	#Run sentiment analysis on tweets
	analyzed_tweets = sentiment_analysis(tweets);
	
	if analyzed_tweets == 'daily-transaction-limit-exceeded':
		return analyzed_tweets
	else:	
	#Write sentiment analysis output back to DB
		update_tweets_in_db(tweets, analyzed_tweets,conn,cur);

		import json
		import demjson
		sns_message = demjson.encode([ { 'search_term' : IDRange[2] , 'id' : IDRange[0] } ])
		# sns_message = [IDRange[0],IDRange[2]];
		
		return sns_message

def sentiment_main(sqs_queue,conn,cur,conn_sns,topic_arn):
	no_of_sqs_messages = -1
	while(no_of_sqs_messages!=0):
		rs = sqs_queue.get_messages(read_num)
		print "Message length : " + str(len(rs))
		no_of_sqs_messages = len(rs)
		if len(rs) > 0:
			m = rs[0];	
		#	process_msg(m.get_body(),conn,cur);

			result_sentiment = process_msg(str(m.get_body()),conn,cur)

			if result_sentiment == 'daily-transaction-limit-exceeded':
				print "AlchemyAPI daily-transaction-limit-exceeded"
			else:
				sns_message = result_sentiment
				sqs_queue.delete_message(m);
				#send notifications to HTTP endpoint via Amazon SNS
				conn_sns.publish(topic=topic_arn, message=sns_message)
		time.sleep(wait_time);	

