import tweets_v2 as tweets
import connections


if __name__ == '__main__':
	
	#connect to mysql database
	db_conn,db_cur = connections.connect_to_mysql()

	#connect to Amazon sqs
	queue_name = 'TwitterMap_gp_2'
	sqs_queue = connections.connect_to_sqs(queue_name)

	#list of search strings
	search_strings = ['owlsbrew','theowlsbrew','owl\'s brew','owls brew','owl\'sbrew','theowl\'sbrew'];
	#search_strings = ['owl\'s brew'];

	#For each search string, perform the following.
	# 1. Fetch data from twitter search api
	# 2. Insert tweets (only with geo location into mysql) and write a single message for each search string into Amazon SQS
	total_tweets = 0;	
	for q in search_strings:
		print "search string = %s"%q
		n = tweets.tweets_main(q,db_conn,db_cur,sqs_queue)
		
		print "***************************************"
