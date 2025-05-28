import praw
import json
import os
from kafka import KafkaProducer

# Configuration of the Reddit API
reddit = praw.Reddit(
    client_id=os.environ["REDDIT_CLIENT_ID"],
    client_secret=os.environ["REDDIT_CLIENT_SECRET"],
    user_agent='reddit-fetcher'
)

# Configuration of the Kafka producer
producer = KafkaProducer(
    bootstrap_servers=os.environ["KAFKA_BOOTSTRAP_SERVERS"],
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

TOPIC = 'reddit-posts' # Kafka topic

def fetch_and_send():
    print("Fetching Reddit posts...")

    # Fetch the hottest 100 posts
    for index, post in enumerate(reddit.subreddit("all").hot(limit=100), start=1):
        post_data = {
            "timestamp": int(post.created_utc),
            "title": post.title,
            "text": post.selftext,
            "karma": post.score,
            "subreddit": post.subreddit.display_name,
            "comments": [],
            "link": f"https://reddit.com{post.permalink}"
        }

        # Get the top 10 comments
        post.comment_sort = "top"
        post.comments.replace_more(limit=0)
        top_comments = post.comments[:10]

        for comment in top_comments:
            post_data["comments"].append((comment.body, comment.score))

        print(index, json.dumps(post_data, indent=2, ensure_ascii=False, sort_keys=False))
        producer.send(TOPIC, post_data) # Send the posts data to the kafka topic

    producer.flush()
    print("Sent posts to Kafka.")

if __name__ == "__main__":
    while True:
        fetch_and_send() # Continuously fetch and send posts data