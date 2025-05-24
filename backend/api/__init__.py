# Blueprints learned from class slides
from flask import Blueprint, request, jsonify, session
from api.nyt import nyt
from db import MongoDBInterface, Comment
from werkzeug.exceptions import BadRequest

API_VERSION = 'v1'

api = Blueprint(f'api', __name__)
# Register public-facing API for retrieving NYT data
api.register_blueprint(nyt, url_prefix='/nyt')

dbApi = MongoDBInterface()

##########################
## API v1 for user info ##
##########################

# Get authenticated user information
#
# GET <API root>/user
# User information is derived from the stored JWT auth token.
@api.route('/user', methods=['GET'])
def api_get_user():
    user_jwt = session.get('user')

    try:
        user_jwt['sub'] # Ensure that sub exists on user JWT
        return jsonify({
            'logged_in': True,
            'email': user_jwt['email'],
            'name': user_jwt['name']
        })
    except Exception:
        return jsonify({
            'logged_in': False
        })


#########################
## API v1 for comments ##
#########################

# Get the tree of comments on a given resource.
# A resource is defined as either an article_id or a comment_id.
#
# GET <API root>/resource/<string:resource_id>
# Returns a Resource JSON object on success
@api.route('/resource/<string:resource_id>', methods=['GET'])
def api_get_resource(resource_id: str):
    return jsonify(dbApi.get_resource(resource_id))

# Get the count of comments on a given resource.
# A resource is defined as either an article_id or a comment_id.
#
# GET <API root>/resource/<string:resource_id>/count
# Returns a number on success
@api.route('/resource/<string:resource_id>/count', methods=['GET'])
def api_get_resource_count(resource_id: str):
    return jsonify(dbApi.get_resource_comment_count(resource_id))

# Create a comment
#
# POST <API root>/comment
# JSON payload:
#   parent_id: <string>
#   body: <string>
# User information is derived from the stored JWT auth token.
# Function returns nothing (in other words a 200 OK code if successful)
@api.route('/comment', methods=['POST'])
def api_create_comment():
    payload = request.get_json()
    if 'parent_id' not in payload:
        raise BadRequest('Request must include a "parent_id" field in the JSON body')
    if 'body' not in payload:
        raise BadRequest('Request must include a "body" field in the JSON body')
    
    if len(payload.get('parent_id')) == 0:
        raise BadRequest('"parent_id" field must be non-empty')
    if len(payload.get('body')) == 0:
        raise BadRequest('"body" field must be non-empty')
    
    user_jwt = session.get('user')
    if user_jwt is None:
        raise BadRequest('User must be authenticated in order to post a comment')
    
    # According to lecture slides I can double-unpack a dictionary into a NamedTuple
    new_comment = Comment(**{
        'comment_id': '', # We can leave comment id field blank since it will be generated
        'user_id': user_jwt['sub'],
        'user_name': user_jwt['name'],
        'body': payload.get('body'),
        'is_deleted': False,
        'replies': [] # The replies field is ignored so we can leave it as a empty list
    })

    dbApi.create_comment(payload.get('parent_id'), new_comment)
    return '', 200

# "Delete" a comment (not true removal of the comment, thus we don't specify an HTTP DELETE verb)
#
# POST <API root>/comment/<string:comment_id>/delete
# User information is derived from the stored JWT auth token.
@api.route('/comment/<string:comment_id>/delete', methods=['POST'])
def api_delete_comment(comment_id: str):
    user_jwt = session.get('user')
    excep_msg = 'User must be authenticated as moderator or administrator in order to delete a comment'
    if user_jwt is None:
        raise BadRequest(excep_msg)
    
    user_name = user_jwt['name']
    if user_name != 'moderator' and user_name != 'admin':
        raise BadRequest(excep_msg)

    dbApi.delete_comment(comment_id)
    return '', 200