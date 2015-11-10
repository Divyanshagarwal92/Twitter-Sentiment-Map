import tweets_v1_d as tweets
import connections_d as connections


if __name__ == '__main__':
	
	#connect to mysql database
	db_conn,db_cur = connections.connect_to_mysql()

	#connect to Amazon sqs
	queue_name = 'TwitterMap_gp_1'
	sqs_queue = connections.connect_to_sqs(queue_name)
	print sqs_queue

	#list of search strings
#	search_strings = ['g20', 'adrian peterson', 'black friday','ebola']
	search_strings = ['clinton']
	#For each search string, perform the following.
	# 1. Fetch data from twitter search api
	# 2. Insert tweets (only with geo location into mysql) and write a single message for each search string into Amazon SQS
	
	for q in search_strings:
		print "search string = %s"%q
		tweets.tweets_main(q,db_conn,db_cur,sqs_queue)
		print "***************************************"
