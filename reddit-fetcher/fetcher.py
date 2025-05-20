import praw
import time
import json
from kafka import KafkaProducer

reddit = praw.Reddit(
    client_id=os.environ["REDDIT_CLIENT_ID"],
    client_secret=os.environ["REDDIT_CLIENT_SECRET"],
    user_agent='reddit-fetcher'
)

producer = KafkaProducer(
    bootstrap_servers=["KAFKA_BOOTSTRAP_SERVERS"],
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

TOPIC = 'reddit-posts'

def fetch_and_send():
    print("Fetching Reddit posts...")

    for submission in reddit.subreddit("all").hot(limit=100):
        post = {
            'id': submission.id,
            'title': submission.title,
            'selftext': submission.selftext,
            'created_utc': submission.created_utc,
            'subreddit': submission.subreddit.display_name,
        }

        print(post)
        producer.send(TOPIC, post)

    producer.flush()
    print("Sent posts to Kafka.")

if __name__ == "__main__":
    while True:
        fetch_and_send()
        time.sleep(60)
