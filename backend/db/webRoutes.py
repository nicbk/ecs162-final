from flask import Flask, request, jsonify, send_from_directory
import os
from flask_cors import CORS
from mongodb import MongoDBInterface


static_path = os.getenv('STATIC_PATH','static')
template_path = os.getenv('TEMPLATE_PATH','templates')

mongo_instance = MongoDBInterface()

app = Flask(__name__, static_folder=static_path, template_folder=template_path)
CORS(app)

# Get information on restaurants nearby to the requesting user.
@app.route('/api/v1/restaurants', methods=['GET'])
def getRestaurantInformation():
    pass


#Gets a comment, as well as all nested replies for that comment.
@app.route('/api/v1/comment/<string:comment_id>', methods=['GET'])
def getCommentById(comment_id):
    comment = mongo_instance.get_comment_by_id(comment_id)
    return jsonify(comment), 200

# Gets the tree of comments (comments and replies) for either a restaurant or parent comment
@app.route('/api/v1/comments', methods=['GET'])
def getListofComments():
    data = request.get_json()
    parent_id = data.get('parent_id', None)
    if parent_id is None:
        return jsonify({'error': 'parent_id is required'}), 400
    
    comments = mongo_instance.get_all_comments_on_parent(parent_id)
    return jsonify(comments), 200

# Posts a comment to the restaurant
@app.route('/api/v1/comment/<string:restaurant_id>', methods=['POST'])
def postCommentToRestaurant(restaurant_id):

    pass

# Post a reply to another comment
@app.route('/api/v1/comment/<string:comment_id>', methods=['POST'])
def postReplyToComment(comment_id):
    pass

# Delete a comment
@app.route('/api/v1/comment/<string:comment_id>', methods=['DELETE'])
def deleteComment(comment_id):
    mongo_instance.delete_comment_by_id(comment_id)
    return jsonify({'status': 'Deleted comment from database'})


# Add a like to a specified comment
@app.route('/api/v1/comment/<string:comment_id>/add_like', methods=['POST'])
def addLikeToComment(comment_id):
    mongo_instance.add_comment_like(comment_id)
    return jsonify({'status': 'added like to comment'})


# Remove a like from a specified comment
@app.route('/api/v1/comment/<string:comment_id>/remove_like', methods=['POST'])
def removeLikeFromComment(comment_id):
    mongo_instance.remove_comment_like(comment_id)
    return jsonify({'status': 'removed like from comment'})

################# user routes #################
###############################################

@app.route('/api/v1/user/<string:username>', methods=['GET'])
def getUserByUsername(username):
    user = mongo_instance.get_user_by_username(username)
    if user is None:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user), 200

@app.route('/api/v1/user/<string:username>/bio', methods=['GET'])
def getUserBioByUsername(username):
    bio = mongo_instance.update_user_bio(username)
    if bio is None:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(bio), 200

@app.route('/api/v1/user/<string:username>/profile-image', methods=['POST'])
def updateUserProfileImage(username):
    data = request.get_json()
    profileImage = data.get('profileImage', None)
    if profileImage is None:
        return jsonify({'error': 'profileImage is required'}), 400
    
    mongo_instance.update_user_profile_image(username, profileImage)
    return jsonify({'status': 'Profile image updated successfully'}), 200

print("finished")