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
# db.data didnt work for me - Andrew
# from db.data import Resource, Comment
from db.data import Comment, Restaurant
from datetime import datetime, timezone
from threading import Lock
from typing import Any

COMMENT_REMOVED_STR = 'Comment was removed by moderator'

class MongoDBInterface():
    def __init__(self, isMock: bool = False):
        mongo_uri = os.getenv("MONGO_URI")
        self.isMock = isMock
        # Becomes the mock client during testing
        # PyMongo documentation followed for tutorial on how to use the library https://pymongo.readthedocs.io/en/stable/tutorial.html
        self.mongo = MongoClient(mongo_uri)
        self.db = self.mongo["foodie_database"]
        self.db_lock = Lock()

        # Initialize collections
        self.__initialize_collections()

    def __initialize_collections(self):
        '''Private method to initialize collections in the database.'''
        self.users = self.db['users']
        self.comments = self.db['comments']
        self.images = self.db['images']
        self.restaurants = self.db['restaurants']
        
    # NOTE: The following function is taken from the following GitHub link
    # https://github.com/mongomock/mongomock/issues/569
    #
    # This is because the mock Python Mongo server does not support sessions for transactions.
    @contextmanager
    def transaction_wrapper(self, mongo: MongoClient, recursive_use_transaction: bool = True):
        if recursive_use_transaction:
            try:
                with mongo.start_session() as session:
                    with session.start_transaction():
                        yield mongo
            except NotImplementedError:
                yield mongo
        else:
            yield mongo

    def clear_database(self):
        '''Clear the database by dropping all collections.'''
        with self.transaction_wrapper(self.mongo) as session:
            # Drop all collections in the database
            self.db.drop_collection('comments')
            self.db.drop_collection('images')
            self.db.drop_collection('restaurants')

            # Recreate the collections
            self.__initialize_collections()

    ### Users Collection Methods ###
    ################################
    def add_new_user(self, token: Any):
        '''
        Add a new user to the database.

        Args:
            username (str): The username of the user.
            email (str): The email of the user.
            oauth_id (str): The OAuth ID of the user.
        '''

        with self.transaction_wrapper(self.mongo) as session:
            with self.db_lock:
                # Insert the new user into the database
                existing_user = self.users.find_one({'oauthId': token['sub']})
                if existing_user is not None:
                    raise Exception('User already exists with this OAuth ID')
                
                self.users.insert_one({
                    'username': token['name'],
                    'email': token['email'],
                    'oauthId': token['sub'],
                    'bio': '',
                    'profileImage': token['picture'],
                    'wishList': [],
                    'likedComments': [],
                })

    # username cannot be unique if using firebase auth
    ##################################################
    # def get_user_by_username(self, username: str):
    #     ''' Get a user by their username.'''
    #     with self.transaction_wrapper(self.mongo) as session:
    #         # Find the user in the database
    #         user = self.users.find_one({'username': username})
    #         if user is None:
    #             raise Exception('User not found')

    #         oauthId = user.get('oauthId', None)

    #         return {
    #             "bio": user.get('bio', ''),
    #             "profileImage": user.get('profileImage', None),
    #             "comments": list(self.comments.find({'creatorId': oauthId})),
    #             "wishList": user.get('wishList', []),
    #             "likedComments": user.get('likedComments', []),
    #         }

    def update_user_bio(self, user_id: str, bio: str):
        '''Update the bio of a user'''
        with self.transaction_wrapper(self.mongo) as session:
            # Update the user's bio in the database
            self.users.update_one(
                {'id': user_id},
                {'$set': {'bio': bio}}
            )

    def update_user_profile_image(self, user_id: str, image_data: str):
        '''
        Update the profile image of a user.
        '''

        with self.transaction_wrapper(self.mongo) as session:
            # Update the user's profile image in the database
            self.users.update_one(
                {'id': user_id},
                {'$set': {'profileImage': image_data}}
            )

    def get_user_by_oauth_id(self, oauth_id: str):
        '''Get a user by their OAuth ID.'''
        with self.transaction_wrapper(self.mongo) as session:
            # Find the user in the database
            user = self.users.find_one({'oauthId': oauth_id})
            if user is None:
                raise Exception('User not found')
            return {
                "username": user.get('username', ''),
                "email": user.get('email', ''),
                "bio": user.get('bio', ''),
                "profileImage": user.get('profileImage', None),
                "comments": self.get_user_comments_id(oauth_id),
                "wishList": user.get('wishList', []),
                "likedComments": user.get('likedComments', []),
            }
        

    ### Comments Collection Methods ###
    ###################################

    def post_user_comment(self, parent_id: str, user_id: str, body: str, rating: float, images: list[str], token: Any) -> str:
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
                'parentId': parent_id,
                'username': token['name'],
                'id': comment_id,
                'creatorId': user_id,
                'rating': rating,
                'images': images,
                'body': body,
                'likes': 0,
                'deleted': False,
                'date': datetime.now(timezone.utc),
            })
            return comment_id

    def add_comment_like(self, comment_id: str, user_id: str):
        '''Add a like to a comment'''
        with self.transaction_wrapper(self.mongo) as session:
            # Only add like if user hasn't already liked the comment
            user = self.users.find_one({'oauthId': user_id, 'likedComments': comment_id})
            if user is None:
                comments_result = self.comments.update_one(
                    {'id': comment_id},
                    {'$inc': {'likes': 1}}
                )

                # if the comment is not found its an error
                if comments_result.modified_count == 0:
                    raise Exception('Comment not found')

                self.users.update_one(
                    {'oauthId': user_id},
                    {'$addToSet': {'likedComments': comment_id}}
                )

    def remove_comment_like(self, comment_id: str, user_id: str):
        '''Remove a like from a comment'''
        with self.transaction_wrapper(self.mongo) as session:
            # Only remove like if user has already liked the comment
            user = self.users.find_one({'oauthId': user_id, 'likedComments': comment_id})
            if user is not None:
                # Remove the like from the comment and user
                comments_result = self.comments.update_one(
                    {'id': comment_id},
                    {'$inc': {'likes': -1}}
                )

                # if the comment is not found its an error
                if comments_result.modified_count == 0:
                    raise Exception('Comment not found')

                self.users.update_one(
                    {'oauthId': user_id},
                    {'$pull': {'likedComments': comment_id}}
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
                self.images.delete_one({'imageId': image_id})

            # # Mark the comment as deleted
            # self.comments.update_one(
            #     {'id': comment_id},
            #     {'$set': {'deleted': True}}
            # )
            # Remove the comment from the database
            self.comments.delete_one({'id': comment_id})

            # Remove the comment from the user's liked comments
            self.users.update_many(
                {'likedComments': comment_id},
                {'$pull': {'likedComments': comment_id}}
            )

    '''
    def get_comments_on_parent(self, parent_id: str):
        # Get all comments made on a restaurant or comment by all users
        with self.transaction_wrapper(self.mongo) as session:
            comments = list(self.comments.find({'parentId': parent_id}).sort('date', 1))
            return comments
    '''

    def get_comment_by_id(self, comment_id: str) -> Any:
        '''
        Get a comments and its replies by its ID.
        '''
        with self.transaction_wrapper(self.mongo) as session:
            comment = self.comments.find_one({'id': comment_id})
            if comment is None:
                raise Exception('Comment not found')

            unpacked_comment = Comment(parentId=comment['parentId'],
                id=comment['id'],
                creatorId=comment['creatorId'],
                username=comment['username'],
                rating=comment['rating'],
                images=comment['images'],
                body=comment['body'],
                likes=comment['likes'],
                deleted=comment['deleted'],
                date=str(comment['date']),
                replies=self.get_all_comments_on_parent(comment['id'], is_root_call = False))

            # https://stackoverflow.com/questions/26180528/convert-a-namedtuple-into-a-dictionary
            return unpacked_comment._asdict()

    def get_user_comments_id(self, user_id: str) -> list[str]:
        comments = self.comments.find({'creatorId': user_id}).sort('date', 1)

        return list(map(lambda comment: comment['id'], comments))
        
    def get_all_comments_on_parent(self, parent_id: str, is_root_call = True) -> list[Any]:
        '''
        Get all comments made on a restaurant or comment by all users.
        Returns a list of Comment objects with replies included.
        '''
        with self.transaction_wrapper(self.mongo, recursive_use_transaction=is_root_call) as session:
            comments = self.comments.find({'parentId': parent_id}).sort('date', -1)
            # for comment in comments:
            #     comment['replies'] = self.get_all_comments_on_parent(comment['id'], is_root_call = False)
            all_unpacked_comments: list[Any] = []

            for comment in comments:
                unpacked_comment = Comment(parentId=comment['parentId'],
                    id=comment['id'],
                    creatorId=comment['creatorId'],
                    username=comment['username'],
                    rating=comment['rating'],
                    images=comment['images'],
                    body=comment['body'],
                    likes=comment['likes'],
                    deleted=comment['deleted'],
                    date=str(comment['date']),
                    replies=self.get_all_comments_on_parent(comment['id'], is_root_call = False))
                
                # https://stackoverflow.com/questions/26180528/convert-a-namedtuple-into-a-dictionary
                all_unpacked_comments.append(unpacked_comment._asdict())

            return all_unpacked_comments
        
    def get_user_wishlist(self, user_id: str) -> list[str]:
        '''Get the user's wishlist of restaurant IDs.'''
        with self.transaction_wrapper(self.mongo) as session:
            user = self.users.find_one({'oauthId': user_id})
            if user is None:
                raise Exception('User not found')

            # Return the user's wishlist
            return user.get('wishList', [])
        
    def add_restaurant_to_wishlist(self, user_id: str, restaurant_id: str):
        '''Add a restaurant to the user's wishlist.'''
        with self.transaction_wrapper(self.mongo) as session:
            user = self.users.find_one({'oauthId': user_id})
            if user is None:
                raise Exception('User not found')

            # Add the restaurant to the user's wishlist
            self.users.update_one(
                {'oauthId': user_id},
                {'$addToSet': {'wishList': restaurant_id}}
            )

    def remove_restaurant_from_wishlist(self, user_id: str, restaurant_id: str):
        '''Add a restaurant to the user's wishlist.'''
        with self.transaction_wrapper(self.mongo) as session:
            user = self.users.find_one({'oauthId': user_id})
            if user is None:
                raise Exception('User not found')

            # Remove the restaurant from the user's wishlist
            self.users.update_one(
                {'oauthId': user_id},
                {'$pull': {'wishList': restaurant_id}}
            )

    ### Image Collection Methods ###
    ################################

    def upload_image(self, image: str) -> str:
        '''Upload an image to the database and return the image ID'''
        with self.transaction_wrapper(self.mongo) as session:
            # Generate a new UUIDv4 ID for the image
            image_id = str(uuid4())

            # Insert the image into the database
            self.images.insert_one({
                'imageId': image_id,
                'data': Binary(image.encode('utf-8'), UuidRepresentation.STANDARD)
            })
            return image_id

    def get_image(self, image_id: str) -> str:
        '''Get an image from the database by its ID'''
        with self.transaction_wrapper(self.mongo) as session:
            # Find the image in the database
            image = self.images.find_one({'imageId': image_id})
            if image is None:
                raise Exception('Image not found')
            return image['data'].decode('utf-8')

    def delete_image(self, image_id: str):
        '''Delete an image from the database by its ID'''
        with self.transaction_wrapper(self.mongo) as session:
            # Check if the image exists
            image = self.images.find_one({'imageId': image_id})
            if image is None:
                raise Exception('Image not found')

            # Delete the image from the database
            self.images.delete_one({'imageId': image_id})

    ### RESTAURANT COLLECTION METHODS ###
    #####################################
    def get_restaurant_by_id(self, restaurant_id: str) -> Restaurant:
        '''Get a restaurant by its ID.'''
        with self.transaction_wrapper(self.mongo) as session:
            restaurant = self.restaurants.find_one({'id': restaurant_id})
            if restaurant is None:
                return None

            unpacked_restaurant = Restaurant(
                id=restaurant['id'],
                displayName=restaurant['displayName'],
                formattedAddress=restaurant['formattedAddress'],
                location=restaurant['location'],
                rating=restaurant['rating'],
                googleMapsUri=restaurant['googleMapsUri'],
                regularOpeningHours=restaurant.get('regularOpeningHours', {}),
                priceLevel=restaurant.get('priceLevel', ''),
                priceRange=restaurant.get('priceRange', {}),
                takeout=restaurant.get('takeout', False),
                delivery=restaurant.get('delivery', False),
                dineIn=restaurant.get('dineIn', False),
                images=restaurant['images']
            )

            return unpacked_restaurant._asdict()
        
    def update_restaurant(self, restaurant: Restaurant):
        '''Update a restaurant in the database.'''
        with self.transaction_wrapper(self.mongo) as session:
            # Update the restaurant in the database insert if it does not exist
            # Check if the restaurant exists
            existing_restaurant = self.restaurants.find_one({'id': restaurant.id})
            if existing_restaurant is None:
                # Insert new restaurant
                self.restaurants.insert_one({
                    'id': restaurant.id,
                    'displayName': restaurant.displayName,
                    'formattedAddress': restaurant.formattedAddress,
                    'location': restaurant.location,
                    'rating': restaurant.rating,
                    'googleMapsUri': restaurant.googleMapsUri,
                    'regularOpeningHours': restaurant.regularOpeningHours,
                    'priceLevel': restaurant.priceLevel,
                    'priceRange': restaurant.priceRange,
                    'takeout': restaurant.takeout,
                    'delivery': restaurant.delivery,
                    'dineIn': restaurant.dineIn,
                    'images': restaurant.images,
                })
            else:
                # Update existing restaurant
                self.restaurants.update_one(
                    {'id': restaurant.id},
                    {'$set': {
                        'displayName': restaurant.displayName,
                        'formattedAddress': restaurant.formattedAddress,
                        'location': restaurant.location,
                        'rating': restaurant.rating,
                        'googleMapsUri': restaurant.googleMapsUri,
                        'regularOpeningHours': restaurant.regularOpeningHours,
                        'priceLevel': restaurant.priceLevel,
                        'priceRange': restaurant.priceRange,
                        'takeout': restaurant.takeout,
                        'delivery': restaurant.delivery,
                        'dineIn': restaurant.dineIn,
                        'images': restaurant.images,
                    }},
                    upsert=False
                )

    ### MOCK SETUP METHODS #########
    ################################
    def setup_mock_data(self, comments: list[Comment], restaurants: list[Restaurant]):
        '''Mock setup for populating the database with inital data.'''
        def dfsCommentInsert(comment: Comment):
            # Generate a new UUIDv4 ID for the comment
            comment_data = {
                'parentId': comment.parentId,
                'id': comment.id,
                'creatorId': comment.creatorId,
                'rating': comment.rating,
                'images': comment.images,
                'body': comment.body,
                'likes': comment.likes,
                'deleted': comment.deleted,
                'date': datetime.now(timezone.utc),
            }
            self.comments.insert_one(comment_data)
            for reply in comment.replies:
                dfsCommentInsert(reply)

        for comment in comments:
            dfsCommentInsert(comment)

        for restaurant in restaurants:
            restaurant_data = {
                'id': restaurant.id,
                'displayName': restaurant.displayName,
                'rating': restaurant.rating,
                'formattedAddress': restaurant.formattedAddress,
                'images': restaurant.images,
                'googleMapsUri': restaurant.googleMapsUri,
            }
            self.restaurants.insert_one(restaurant_data)

    def get_mock_restaurants(self) -> list[Restaurant]:
        '''Get all mock restaurants from the database.'''
        with self.transaction_wrapper(self.mongo) as session:
            restaurants = list(self.restaurants.find())
            return [Restaurant(**restaurant) for restaurant in restaurants]
        
        