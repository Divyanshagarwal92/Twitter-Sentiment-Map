import boto.sqs
import boto.sns

aws_region = "us-east-1"
aws_access_key = 'AKIAJ2JHJOQA52LBFEJQ'
aws_secret_key = '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'


conn_sns = boto.sns.connect_to_region( aws_region, aws_access_key_id=aws_access_key, \
			aws_secret_access_key=aws_secret_key);

#create a sns topic
topic_name = 'test_topic1'
#	sns_topic = conn_sns.create_topic(topic_name)

topic_arn = 'arn:aws:sns:us-east-1:900405216214:test_topic1'
endpoint = 'http://ec2-54-174-83-22.compute-1.amazonaws.com:3000/sns'
protocol = 'http'
#	conn_sns.subscribe(topic_arn,protocol,endpoint)
#	msg = 'sns publish message test 2'
#	conn_sns.publish(topic=topic_arn, message=msg)

sns_message = (101,201,'term1')
conn_sns.publish(topic=topic_arn, message=sns_message)

