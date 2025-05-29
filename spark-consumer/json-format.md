"""{
 timestamp: int
 title: string
 karma: int //number of upvotes
 text: string
 subreddit: string // name of subreddit
 comments: [(text,karma)] list of (strings*integers) //top 5 comments, with their respective karma
 link: string // url of the post
}"""