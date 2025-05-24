# NOTE: The following code is taken and inspired from the lecture slides on MongoDB w/ Flask
#  in order to implement an abstract interface and MongoDB concrete class for data access.

# NOTE: We designed a schema for our MongoDB data layout.
# Access it here (Must be signed in with UC Davis email): https://docs.google.com/document/d/1FWpaCnH2N6vqdRdwwNJWM8tQG78wexmKz_ULTsvxXe0/edit?tab=t.0
import os
import time
from bson import Binary, UuidRepresentation
from uuid import uuid4
from pymongo import MongoClient
from contextlib import contextmanager
from db.interface import DBInterface
from db.data import Resource, Comment

COMMENT_REMOVED_STR = 'Comment was removed by moderator'

class MongoDBInterface(DBInterface):
    def __init__(self):
        mongo_uri = os.getenv("MONGO_URI")
        # Becomes the mock client during testing
        # PyMongo documentation followed for tutorial on how to use the library https://pymongo.readthedocs.io/en/stable/tutorial.html
        self.mongo = MongoClient(mongo_uri)
        self.db = self.mongo["mydatabase"]
        self.comments = self.db['comments']
    
    # NOTE: The following function is taken from the following GitHub link
    # https://github.com/mongomock/mongomock/issues/569
    #
    # This is because the mock Python Mongo server does not support sessions for transactions.
    @contextmanager
    def transaction_wrapper(self, mongo: MongoClient):
        try:
            with mongo.start_session() as session:
                with session.start_transaction():
                    yield mongo
        except NotImplementedError:
            yield mongo
    
    # Helper function to get the content of a resource
    # param parent_id: UUID of parent resource
    # param include_comment: whether to include the actual comment data
    # returns: pair of comment list and total number of comments found
    # Applies DFS to perform exhaustive search of comment tree
    def internal_get_comments(self, parent_id: str, include_comment_data: bool) -> tuple[list[any], int]:
        count = 0
        comments = []

        # According to https://www.w3schools.com/python/python_mongodb_sort.asp
        # I can sort using a function call on the result of a find() call
        for db_comment in self.comments.find({'parent_id': parent_id}).sort('timestamp', 1):
            # Increment count for the current comment
            count += 1

            # Apply recursive DFS to get child comment data
            # "dfs_replies" represents all replies down the rest of the tree
            # "childCount" represents the total number of comments down the rest of the tree
            dfs_replies, childCount = self.internal_get_comments(db_comment['comment_id'], include_comment_data)
            # Add child count to current level count
            count += childCount

            # If function is set to include comment data, then process and add the comment data
            if include_comment_data:
                # I can double-destructure a dict into a NamedTuple according to lecture slides
                comment = Comment(**{
                    'comment_id': db_comment['comment_id'],
                    'user_id': db_comment['user_id'],
                    'user_name': db_comment['user_name'],
                    'body': COMMENT_REMOVED_STR if db_comment['is_deleted'] else db_comment['body'],
                    'is_deleted': db_comment['is_deleted'],
                    'replies': dfs_replies
                })

                # According to https://stackoverflow.com/questions/26180528/convert-a-namedtuple-into-a-dictionary
                # I can use _asdict() to convert the NamedTuple to a dict
                comments.append(comment._asdict())
        
        return (comments, count)

    # Get comment count for a resource
    # A resource_id is defined as either an article_id or a comment_id
    # param resource_id: UUID of resource
    # returns: count
    def get_resource_comment_count(self, resource_id: str) -> int:
        # I use MongoDB Transactions https://pymongo.readthedocs.io/en/stable/api/pymongo/client_session.html
        # in order to ensure ACID compliance
        countResult = None
        with self.transaction_wrapper(self.mongo) as session:
            # Return the count for the total number of comments
            countResult = self.internal_get_comments(resource_id, False)[1]
        
        if countResult is None:
            raise Exception('Unable to complete get_resource_comment_count() transaction')

        return countResult

    # Get a resource
    # A resource_id is defined as either an article_id or a comment_id
    # param resource_id: UUID of resource
    # returns: Resource
    def get_resource(self, resource_id: str) -> Resource:
        # Get the forest of comments for the specified resource
        resource = None
        with self.transaction_wrapper(self.mongo) as session:
            resource_comments = self.internal_get_comments(resource_id, True)[0]
            resource = Resource(**{
                'resource_id': resource_id,
                'comments': resource_comments
            })

        if resource is None:
            raise Exception('Unable to complete get_resource() transaction')

        # According to https://stackoverflow.com/questions/26180528/convert-a-namedtuple-into-a-dictionary
        # I can use _asdict() to convert the NamedTuple to a dict
        return resource._asdict()

    # Create a comment
    # param parent_id: UUID of parent resource
    # param comment: comment content
    # returns: Nothing
    def create_comment(self, parent_id: str, comment: Comment) -> None:
        with self.transaction_wrapper(self.mongo) as session:
            self.comments.insert_one({
                'parent_id': parent_id,
                # When inserting a new comment, we can ignore the comment_id field, and instead generate a new UUIDv4 ID
                # We use UUIDv4.
                # Its distributed stochastic nature means that we do not need centralized bookkeeping.
                # The tradeoff is accepted because a technically possible bug due to chance of collision is considered adequately infeasible
                # given the low volume of comments on this homework.
                # Source: https://en.wikipedia.org/wiki/Universally_unique_identifier#:~:text=Thus%2C%20the%20probability%20to%20find,later%20in%20the%20manufacturing%20process.
                # Generate an UUIDv4 according to https://pymongo.readthedocs.io/en/stable/examples/uuid.html
                'comment_id': str(uuid4()),
                # According to https://www.geeksforgeeks.org/python-time-time_ns-method/
                # I can get the time in nanoseconds.
                # Then, I cast this to a string and it can be used for sorting comments by creation time.
                # It is unlikely that comments will be created at the same time.
                # Even if that happens, the ambiguous order of a single pair of comments is not a mission-critical or security-vulnerable bug.
                'timestamp': str(time.time_ns()),
                'user_id': comment.user_id,
                'user_name': comment.user_name,
                'body': comment.body,
                'is_deleted': False
            })

    # Delete a comment (not a true delete, but rather mark entire comment as redacted)
    # param comment_id: UUID of comment
    # returns: Nothing
    # This method should set a flag in the database that specifies the comment is deleted.
    # When the get_resource() call constructs a tree of comments, then comments specified as deleted will
    # have the body containing a default deleted message.
    def delete_comment(self, comment_id: str) -> None:
        with self.transaction_wrapper(self.mongo) as session:
            # According to https://www.w3schools.com/python/python_mongodb_update.asp
            # I can update a single document using update_one().
            # I guarantee that comment_id is approximately unique (see the create_comment() handler), so I query by it.
            comment_query = { 'comment_id': comment_id }
            comment_update = {
                '$set': {
                    'is_deleted': True
                }
            }
            self.comments.update_one(comment_query, comment_update)