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
from datetime import datetime, timezone

COMMENT_REMOVED_STR = 'Comment was removed by moderator'

class MongoDBInterface(DBInterface):
    def __init__(self):
        mongo_uri = os.getenv("MONGO_URI")
        # Becomes the mock client during testing
        # PyMongo documentation followed for tutorial on how to use the library https://pymongo.readthedocs.io/en/stable/tutorial.html
        self.mongo = MongoClient(mongo_uri)
        self.db = self.mongo["foodie_database"]
        self.users = self.db['users']
        self.comments = self.db['comments']
        self.images = self.db['images']

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

    ### Comments Collection Methods ###
    ###################################

    def post_user_comment(self, parent_id: str, user_id: str, body: str, images: list[str]) -> str:
        '''
        Post a comment made by a user on a restaurant or another comment.

        Args:
            parent_id (str): UUID of the parent resource (restaurant or comment).
            user_id (str): UUID of the user posting the comment.
            body (str): The content of the comment.
            images (list[str]): List of image IDs associated with the comment.

        Returns:
            str: The UUID of the newly created comment.
        '''

        with self.transaction_wrapper(self.mongo) as session:
            # Generate a new UUIDv4 ID for the comment
            comment_id = str(uuid4())

            # Insert the comment into the database
            self.comments.insert_one({
                'parent_id': parent_id,
                'id': comment_id,
                'creator_id': user_id,
                'images': images,
                'body': body,
                'likes': 0,
                'deleted': False,
                'date': datetime.now(timezone.utc),
            })
            return comment_id

    def add_comment_like(self, comment_id: str):
        '''Add a like to a comment'''
        with self.transaction_wrapper(self.mongo) as session:
            # Increment the like count for the comment
            self.comments.update_one(
                {'id': comment_id},
                {'$inc': {'likes': 1}}
            )

    def remove_comment_like(self, comment_id: str):
        '''Remove a like from a comment'''
        with self.transaction_wrapper(self.mongo) as session:
            # Decrement the like count for the comment
            self.comments.update_one(
                {'id': comment_id},
                {'$inc': {'likes': -1}}
            )

    def delete_comment_by_id(self, comment_id: str):
        '''
        Delete a comment by its ID
        Also removes corresponding images from the database
        '''
        with self.transaction_wrapper(self.mongo) as session:
            # Find image ids associated with the comment
            comment = self.comments.find_one({'id': comment_id})
            if comment is None:
                raise Exception('Comment not found')

            # Remove images associated with the comment
            for image_id in comment['images']:
                self.images.delete_one({'image_id': image_id})

            # Mark the comment as deleted
            self.comments.update_one(
                {'id': comment_id},
                {'$set': {'deleted': True}}
            )

    def get_user_comments(self, parent_id: str):
        '''Get all comments made on a restaurant or comment by all users'''
        with self.transaction_wrapper(self.mongo) as session:
            comments = list(self.comments.find({'parent_id': parent_id}).sort('date', 1))
            return comments

    ### Image Collection Methods ###
    ################################

    def upload_image(self, image: str) -> str:
        '''Upload an image to the database and return the image ID'''
        with self.transaction_wrapper(self.mongo) as session:
            # Generate a new UUIDv4 ID for the image
            image_id = str(uuid4())

            # Insert the image into the database
            self.images.insert_one({
                'image_id': image_id,
                'data': Binary(image.encode('utf-8'), UuidRepresentation.STANDARD)
            })
            return image_id

    def get_image(self, image_id: str) -> str:
        '''Get an image from the database by its ID'''
        with self.transaction_wrapper(self.mongo) as session:
            # Find the image in the database
            image = self.images.find_one({'image_id': image_id})
            if image is None:
                raise Exception('Image not found')
            return image['data'].decode('utf-8')

    def delete_image(self, image_id: str):
        '''Delete an image from the database by its ID'''
        with self.transaction_wrapper(self.mongo) as session:
            # Check if the image exists
            image = self.images.find_one({'image_id': image_id})
            if image is None:
                raise Exception('Image not found')

            # Delete the image from the database
            self.images.delete_one({'image_id': image_id})