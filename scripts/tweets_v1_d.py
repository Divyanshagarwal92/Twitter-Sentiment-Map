import twitter
import json
import re
import pymysql
from time import gmtime, strftime
from boto.sqs.message import Message


#This script extracts tweets for a given keyword search term from "twitter search api" and inserts into the mysql database.
# Once tweet is inserted successfully, a message is written to amazon sqs queue with "start_id_str" and "end_id_str"

#create a twitter app and fetch the twitter credentials
consumer_key = 'dIoeyySs7S8u4sXsnEzslRCpw'
consume_secret = 'qrVJgL01cbzvBMOoCS8btCsQDbadyV9ZtFORPqDZGy5iPbAHoB'
access_token = '38030048-A7KIAUUE2qL1LUSruwjwDqrVp6H0KNN0GL7huaJAD'
access_token_secret = '5jxN4IlNGcjPKHIcUTPq6Cmv50UmLvYM0tqmnJTBIQEnD'

#authenticate login with credentials
auth = twitter.oauth.OAuth(access_token, access_token_secret,consumer_key,consume_secret)
twitter_api = twitter.Twitter(auth=auth)

#Extract data from Twitter using the Get search API call to twitter
def twitter_search(twitter_api, q, max_id_str,max_results=100, **kw):

    # See https://dev.twitter.com/docs/api/1.1/get/search/tweets and 
    # https://dev.twitter.com/docs/using-search for details on advanced 
    # search criteria that may be useful for keyword arguments
    
    # See https://dev.twitter.com/docs/api/1.1/get/search/tweets    

    if max_id_str == 0:
        search_results = twitter_api.search.tweets(q=q, count=50,request_type='recent',**kw)        
    else:    
        search_results = twitter_api.search.tweets(q=q, count=50,request_type='recent',since_id=max_id_str, **kw)        
    
    statuses = search_results['statuses']
#    print "length of status = %d"%len(statuses)
    
    # Iterate through batches of results by following the cursor until we
    # reach the desired number of results, keeping in mind that OAuth users
    # can "only" make 180 search queries per 15-minute interval. See
    # https://dev.twitter.com/docs/rate-limiting/1.1/limits
    # for details. A reasonable number of results is ~1000, although
    # that number of results may not exist for all queries.
    
    # Enforce a reasonable limit
    max_results = min(1000, max_results) #enforcing limit of 1000 tweets
    print "max_results " + str(max_results)
    for _ in range(30): 
        try:
            next_results = search_results['search_metadata']['next_results']
        except KeyError, e: # No more results when next_results doesn't exist
            print "I am here"
            break
            
        # Create a dictionary from next_results, which has the following form:
        # ?max_id=313519052523986943&q=NCAA&include_entities=1
        kwargs = dict([ kv.split('=') 
                        for kv in next_results[1:].split("&") ])
        
        search_results = twitter_api.search.tweets(**kwargs)
        statuses += search_results['statuses']
        
#        print len(statuses)
        if len(statuses) > max_results: 
            break
            
    return statuses



def insert_into_mysql(conn,cur,tweet_json,q,start_id_str,end_id_str):
    no_of_records_inserted = 0
    search_string = q
    for i in range(len(tweet_json)):
        id_str = tweet_json[i]['id_str']
#        print "id_str %s"%id_str
        created_at = tweet_json[i]['created_at']
        longitude = tweet_json[i]['coordinates']['coordinates'][0]
        latitude = tweet_json[i]['coordinates']['coordinates'][1]
        fav_count = tweet_json[i]['favorite_count']
        text = re.sub(r'[^a-zA-Z0-9: ]', '', tweet_json[i]['text'])
        lang = tweet_json[i]['lang']

        sql = "INSERT IGNORE INTO tweets (search_string,id_str,created_at,longitude,latitude,text,fav_count,lang) VALUES("'"%s"'","'"%s"'","'"%s"'",%f,%f,"'"%s"'",%d,"'"%s"'")"%(search_string,id_str,created_at,longitude,latitude,text,fav_count,lang)
        cur.execute(sql)
        conn.commit()
        no_of_records_inserted = no_of_records_inserted + 1
    print "no_of_records_inserted into mysql = %d"%no_of_records_inserted        
    return no_of_records_inserted


def insert_into_sqs(sqs_queue,start_id_str,end_id_str,q):
#Creating Msg - It contains start_id, end_id of the tweets and the search term
    m = Message()
    msg = start_id_str + '|' + end_id_str + '|' + q
    print msg
    m.set_body( msg );
    sqs_queue.write(m)
    print "after sqs write"


#Fetch the max value of id_str from the mysql database. Twitter search api is called only for the newest data that is not present in mysql
def fetch_max_id_str(cur,q):
    sql = "select max(id_str) from tweets where search_string = " + "'" + q + "'"
    cur.execute(sql)
    output = cur.fetchall()

    if (output[0][0] is None) or (len(output[0][0]) == 0):
        max_id_str = 0
    else:
        max_id_str = int(output[0][0])
    return max_id_str


def tweets_main(q,conn,cur,sqs_queue):
#    print strftime("%Y-%m-%d %H:%M:%S", gmtime())
    #fetch the max id_str from the mysql database. Idea is to fetch only the latest rows since last fetch from twitter    
    max_id_str = fetch_max_id_str(cur,q)
#    print max_id_str
    #query twitter
    results = twitter_search(twitter_api, q, max_id_str,max_results=3000)
    #print results
    print 'Twitter results extracted'
    tweet_json = []
    for j in range(len(results)):
        x = json.dumps(results[j],indent=1)
        tweet_json.append(json.loads(x))
    #Extract only tweets with geo location 
    tweet_json_with_coordinates = [tweet for tweet in tweet_json if tweet['coordinates']!=None]
    print "length of tweets with coordinates = %d" %len(tweet_json_with_coordinates)
    
    if len(tweet_json_with_coordinates) > 0:
        end_id_str = tweet_json_with_coordinates[0]['id_str']
        start_id_str = tweet_json_with_coordinates[len(tweet_json_with_coordinates)-1]['id_str']

        print 'Insert into mysql database'
        no_of_records_inserted = insert_into_mysql(conn,cur,tweet_json_with_coordinates,q,start_id_str,end_id_str)

        print 'Write a new message to amazon SQS queue'
        if no_of_records_inserted !=0:
            print "i am here"
            insert_into_sqs(sqs_queue,start_id_str,end_id_str,q)


#if __name__ == '__main__':
#    tweets_main()



    
