import sentiment_analysis_v2 as sentiment
import connections_v2 as connections
import boto.sqs


if __name__ == '__main__':
	
	#connect to mysql database
	db_conn,db_cur = connections.connect_to_mysql()

	#connect to Amazon sqs
	queue_name = 'TwitterMap_gp_1'
	sqs_queue = connections.connect_to_sqs(queue_name)

#	sqs_queue = conn_sqs.get_queue(queue_name)


	#connect to the sns
	conn_sns,topic_arn = connections.connect_to_sns()

	#sentiment_analysis module performs the following
	# 1. Reads messages from the SQS queue and performs sentiment_analysis and updates the mysql with sentiment score
	# 2. Upon successful update to mysql, inserts a notification into Amazon SNS which will later be consumed by the front end
	sentiment.sentiment_main(sqs_queue,db_conn,db_cur,conn_sns,topic_arn)
