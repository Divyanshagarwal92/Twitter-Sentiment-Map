import temp as sentiment
import connections


if __name__ == '__main__':
	
	#connect to mysql database
	db_conn,db_cur = connections.connect_to_mysql()

	#connect to Amazon sqs
	sqs_queue = connections.connect_to_sqs()

	#sentiment_analysis module performs the following
	# 1. Reads messages from the SQS queue and performs sentiment_analysis and updates the mysql with sentiment score
	# 2. Upon successful update to mysql, inserts a notification into Amazon SNS which will later be consumed by the front end
	sentiment.process_msg(sqs_queue,db_conn,db_cur)
