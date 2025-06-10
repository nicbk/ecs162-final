from flask import Flask, request, jsonify, send_from_directory, redirect, url_for, session
import os
from authlib.integrations.flask_client import OAuth
from authlib.common.security import generate_token
from flask_cors import CORS
import werkzeug
import requests
from werkzeug.exceptions import BadRequest
from google_maps import get_nearby_restaurants
import json
from db.mongodb import MongoDBInterface
from db.data import Comment
import base64
import jwt

static_path = os.getenv('STATIC_PATH','static')
template_path = os.getenv('TEMPLATE_PATH','templates')

mongo_instance = MongoDBInterface()

app = Flask(__name__, static_folder=static_path, template_folder=template_path)
CORS(app)

# NOTE: OAuth setup is copied from the updated starter code
# 'secret_key' field on flask app is needed for cryptographically signing cookies https://flask.palletsprojects.com/en/stable/quickstart/#sessions
# This allows the Dex OIDC session information to be set in a cryptographically tamper-proof cookie on the client's browser.
#app.secret_key = os.urandom(24)

#oauth = OAuth(app)
# Dex uses a nonce to prevent replay attacks https://dexidp.io/docs/guides/using-dex/
#nonce = generate_token()

# This code block for setting up the flask OIDC interface to Dex is also copied from starter code
'''
oauth.register(
    name='dex_client',
    client_id=os.getenv('OIDC_CLIENT_ID'),
    client_secret=os.getenv('OIDC_CLIENT_SECRET'),
    authorization_endpoint="http://localhost:5556/auth",
    token_endpoint="http://dex:5556/token",
    jwks_uri="http://dex:5556/keys",
    userinfo_endpoint="http://dex:5556/userinfo",
    device_authorization_endpoint="http://dex:5556/device/code",
    client_kwargs={'scope': 'openid email profile'}
)
'''

# I learn about how to handle errors with the following documentation
# https://flask.palletsprojects.com/en/stable/errorhandling/
@app.errorhandler(werkzeug.exceptions.BadRequest)
def bad_request_handler(err):
    return str(err), 400

# Path to serve frontend resources
@app.route('/')
@app.route('/<path:path>')
def serve_frontend(path=''):
    if path != '' and os.path.exists(os.path.join(static_path,path)):
        return send_from_directory(static_path, path)
    return send_from_directory(template_path, 'index.html')

##########################
##########################
##########################
## API v1 for user info ##
##########################
##########################
##########################

###############################
###############################
## Dex authentication routes ##
###############################
###############################

# Path for authentication login redirect
'''
@app.route('/login')
def login():
    if request.args.get('originUrl') is not None:
        session['originUrl'] = request.args.get('originUrl')
    session['nonce'] = nonce
    # Using "url_for" is much more robust
    # "_external" needed to return full URL which is then used to match the Dex registered callback URL
    # https://docs.authlib.org/en/latest/client/flask.html
    redirect_uri = url_for('authorize', _external=True)
    return oauth.dex_client.authorize_redirect(redirect_uri, nonce=nonce)

# Path for authentication callback
@app.route('/authorize')
def authorize():
    token = oauth.dex_client.authorize_access_token()
    nonce = session.get('nonce')

    user_info = oauth.dex_client.parse_id_token(token, nonce=nonce)  # or use .get('userinfo').json()
    session['user'] = user_info

    # Original URL was 8000 which was flask port
    frontend_url = os.getenv('FRONTEND_URL', f"http://localhost:{os.getenv('FRONTEND_PORT', '5173')}")
    
    if 'originUrl' in session:
        redirect_url = f"{frontend_url}{session['originUrl']}"
        return redirect(redirect_url)

    return redirect('/')

# Path for logging out
@app.route('/logout')
def logout():
    originUrl = None
    if 'originUrl' in session:
        originUrl = session['originUrl']

    session.clear()
    if originUrl is not None:
        return redirect(originUrl)
    return redirect('/')
'''

# Verify Firebase JWT and retrieve the token data 
# @param header: value of the Authorization header
# @returns False if the header is None or invalid, otherwise the contents of the JWT
def get_authorization(header):
    if header is None:
        return False

    # https://auth0.com/blog/how-to-handle-jwt-in-python/
    # https://pyjwt.readthedocs.io/en/stable/
    # The expected auth header format is 'Bearer <jwt_string>', so we must get the second item
    jwt_string = header.split()[1]

    # https://pyjwt.readthedocs.io/en/stable/usage.html#oidc-login-flow
    # I follow the above guide to set up the Google JWT verification logic
    # NOTE: Some lines are copied, but that is because this is configuration code.
    oidc_config = requests.get('https://accounts.google.com/.well-known/openid-configuration').json()
    
    jwtsign_client = jwt.PyJWKClient('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
    # https://www.googlecloudcommunity.com/gc/Apigee/validate-firebase-ID-token-through-the-use-of-jwt-verify/m-p/624340
    jwt_signing_key = jwtsign_client.get_signing_key_from_jwt(jwt_string)

    # https://pyjwt.readthedocs.io/en/latest/usage.html
    # Decode JWT at first without verifying signature to extract audience that can be passed into the signature verification
    payload_before = jwt.decode(jwt_string, options={ 'verify_signature': False })

    try:
        token_data = jwt.decode(
            jwt_string,
            key=jwt_signing_key,
            audience=payload_before['aud'],
            algorithms=oidc_config['id_token_signing_alg_values_supported'],
        )

        return token_data
    except:
        return False


############################
############################
## Restaurant/Comment API ##
############################
############################

#####################
## READ OPERATIONS ##
#####################

# Get information on restaurants nearby to the requesting user.
@app.route('/api/v1/restaurants', methods=['GET'])
def getRestaurantInformation():
    latitude_raw = request.args.get('latitude')
    if latitude_raw is None:
        raise BadRequest('latitude must be provided')
    latitude = float(latitude_raw)

    longitude_raw = request.args.get('longitude')
    if longitude_raw is None:
        raise BadRequest('longitude must be provided')
    longitude = float(longitude_raw)

    limit_raw = request.args.get('limit')
    if limit_raw is None:
        raise BadRequest('limit must be provided')
    limit = int(limit_raw)

    if limit > 30:
        raise BadRequest('limit must be less than 30')

    radius_raw = request.args.get('radius')
    if radius_raw is None:
        raise BadRequest('radius must be provided')
    radius = float(radius_raw)

    if radius > 50000:
        raise BadRequest('radius must be less than 500000 meters')

    nearbyRestaurants = get_nearby_restaurants(app, latitude, longitude, limit, radius)

    if mongo_instance.isMock:
        mock_restaurants = mongo_instance.get_mock_restaurants()
        return jsonify(nearbyRestaurants + mock_restaurants)
    
    return get_nearby_restaurants(app, latitude, longitude, limit, radius)

#Gets a comment, as well as all nested replies for that comment.
@app.route('/api/v1/comment/<string:comment_id>', methods=['GET'])
def getCommentById(comment_id):
    comment = mongo_instance.get_comment_by_id(comment_id)
    
    return jsonify(comment), 200

# Gets the tree of comments (comments and replies) for either a restaurant or parent comment
@app.route('/api/v1/comments', methods=['GET'])
def getListofComments():
    parent_id = request.args.get('parent_id')
    if parent_id is None:
        return jsonify({'error': 'parent_id is required'}), 400

    comments = mongo_instance.get_all_comments_on_parent(parent_id)

    return jsonify(comments), 200

# Posts a comment to the restaurant or reply to comment
@app.route('/api/v1/comment/<string:restaurant_id_or_comment_id>', methods=['POST'])
def postComment(restaurant_id_or_comment_id):
    data = request.get_json()
    # Parse out the pieces of the json
    comment = data['body']
    rating = data.get('rating', float("NaN"))

    # Getting request headers:
    # https://stackoverflow.com/questions/29386995/how-to-get-http-headers-in-flask
    token = get_authorization(request.headers.get('Authorization'))
    if not token:
        return jsonify({'error': 'User not authenticated'}), 401
    user_id = token['sub']
    images = data['images']

    mongo_instance.post_user_comment(restaurant_id_or_comment_id, user_id, comment, rating, images, token)

    return jsonify({'status': 'comment posted'})

# Delete a comment
@app.route('/api/v1/comment/<string:comment_id>', methods=['DELETE'])
def deleteComment(comment_id):
    mongo_instance.delete_comment_by_id(comment_id)
    return jsonify({'status': 'Deleted comment from database'})


# Add a like to a specified comment
@app.route('/api/v1/comment/<string:comment_id>/add-like', methods=['POST'])
def addLikeToComment(comment_id):
    # Getting request headers:
    # https://stackoverflow.com/questions/29386995/how-to-get-http-headers-in-flask
    token = get_authorization(request.headers.get('Authorization'))
    if not token:
        return jsonify({'error': 'User not authenticated'}), 401
    user_id = token['sub']

    mongo_instance.add_comment_like(comment_id, user_id)
    return jsonify({'status': 'added like to comment'})


# Remove a like from a specified comment
@app.route('/api/v1/comment/<string:comment_id>/remove-like', methods=['POST'])
def removeLikeFromComment(comment_id):
    # Getting request headers:
    # https://stackoverflow.com/questions/29386995/how-to-get-http-headers-in-flask
    token = get_authorization(request.headers.get('Authorization'))
    if not token:
        return jsonify({'error': 'User not authenticated'}), 401
    user_id = token['sub']

    mongo_instance.remove_comment_like(comment_id, user_id)
    return jsonify({'status': 'removed like from comment'})

################# user routes #################
###############################################

# After creating a new user in dex, we need to create a user in our MongoDB
# @app.route('/api/v1/user/create', methods=['POST'])
# def createUser():
#     # Getting request headers:
#     # https://stackoverflow.com/questions/29386995/how-to-get-http-headers-in-flask
#     token = get_authorization(request.headers.get('Authorization'))
#     if not token:
#         return jsonify({'error': 'User not authenticated'}), 401

#     user_id = token['sub']
#     user_email = token.get('email', '')
#     username = token.get('username', 'User')

#     try:
#         mongo_instance.add_new_user(username, user_email, user_id)
#     except Exception as e:
#         return jsonify({'error': str(e)}), 500
    
#     return jsonify({'status': 'User created successfully'}), 200


@app.route('/api/v1/user/<string:username>', methods=['GET'])
def getLoggedInUserUsername(username):
    token = get_authorization(request.headers.get('Authorization'))
    if not token:
        return jsonify({'error': 'User not authenticated'}), 401

    user_id = token['sub']

    user = mongo_instance.get_user_by_oauth_id(user_id)
    if user is None:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user), 200

@app.route('/api/v1/user/<string:username>/bio', methods=['GET'])
def getLoggedInUserBio(username):
    token = get_authorization(request.headers.get('Authorization'))
    if not token:
        return jsonify({'error': 'User not authenticated'}), 401

    user_id = token['sub']

    user = mongo_instance.get_user_by_oauth_id(user_id)
    if user is None:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.get("bio", None)), 200

@app.route('/api/v1/user/<string:username>/bio', methods=['POST'])
def updateUserBio(username):
    bio = request.get_json['bio']

    # Getting request headers:
    # https://stackoverflow.com/questions/29386995/how-to-get-http-headers-in-flask
    token = get_authorization(request.headers.get('Authorization'))
    if not token:
        return jsonify({'error': 'User not authenticated'}), 401

    user_id = token['sub']

    mongo_instance.update_user_bio(user_id, bio)
    return jsonify({'status': 'Bio updated successfully'}), 200

@app.route('/api/v1/user/<string:username>/profile-image', methods=['POST'])
def updateUserProfileImage(username):
    data = request.get_json()
    profileImage = data.get('profileImage', None)
    if profileImage is None:
        return jsonify({'error': 'profileImage is required'}), 400

    token = get_authorization(request.headers.get('Authorization'))
    if not token:
        return jsonify({'error': 'User not authenticated'}), 401

    user_id = token['sub']

    mongo_instance.update_user_profile_image(user_id, profileImage)
    return jsonify({'status': 'Profile image updated successfully'}), 200

# Gets Current Logged In User Information
@app.route('/api/v1/authed-user', methods=['GET'])
def getUserInformation():
    # Getting request headers:
    # https://stackoverflow.com/questions/29386995/how-to-get-http-headers-in-flask
    token = get_authorization(request.headers.get('Authorization'))
    if not token:
        return jsonify({'error': 'User not authenticated'}), 401

    user_id = token['sub']
    username = token.get('name', None)

    if username is None:
        return jsonify({'error': 'Username not found in token'}), 400
    
    # Fast fallback - return session data immediately
    user_data = {
        'username': token['name'],
        'email': token['email'],
        'oauthId': token['sub']
    }
    
    try :
        mongo_user_data = mongo_instance.get_user_by_oauth_id(user_id)
        # app.logger.warning(mongo_user_data)
        return jsonify(mongo_user_data), 200
    except Exception as e:
        if e.args[0] == 'User not found':
            # If user not found, create a new user in the database
            try:
                mongo_instance.add_new_user(token)
                mongo_user_data = mongo_instance.get_user_by_oauth_id(user_id)
                return jsonify(mongo_user_data), 201 # 201 is successful creation
            
            except Exception as e:
                return jsonify({'error': str(e)}), 500
            
        raise e 
    
# Gets the wishlist of the current logged in user
@app.route('/api/v1/user/wish', methods=['GET'])
def getUserWishlist():
    # Getting request headers:
    # https://stackoverflow.com/questions/29386995/how-to-get-http-headers-in-flask
    token = get_authorization(request.headers.get('Authorization'))
    if not token:
        return jsonify({'error': 'User not authenticated'}), 401

    user_id = token['sub']
    
    try:
        wishlist = mongo_instance.get_user_wishlist(user_id)
        return jsonify(wishlist), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
# Adds a restaurant to the current logged in user's wishlist
@app.route('/api/v1/user/wish/add/<string:restaurant_id>', methods=['POST'])
def addToUserWishlist(restaurant_id):
    # Getting request headers:
    # https://stackoverflow.com/questions/29386995/how-to-get-http-headers-in-flask
    token = get_authorization(request.headers.get('Authorization'))
    if not token:
        return jsonify({'error': 'User not authenticated'}), 401

    user_id = token['sub']

    if restaurant_id is None:
        return jsonify({'error': 'restaurantId is required'}), 400

    try:
        mongo_instance.add_restaurant_to_wishlist(user_id, restaurant_id)
        return jsonify({'status': 'Restaurant added to wishlist'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Removes a restaurant from the current logged in user's wishlist 
@app.route('/api/v1/user/wish/remove/<string:restaurant_id>', methods=['POST'])
def removeFromUserWishlist(restaurant_id):
    # Getting request headers:
    # https://stackoverflow.com/questions/29386995/how-to-get-http-headers-in-flask
    token = get_authorization(request.headers.get('Authorization'))
    if not token:
        return jsonify({'error': 'User not authenticated'}), 401

    user_id = token['sub']

    if restaurant_id is None:
        return jsonify({'error': 'restaurantId is required'}), 400

    try:
        mongo_instance.remove_restaurant_from_wishlist(user_id, restaurant_id)
        return jsonify({'status': 'Restaurant removed from wishlist'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


################# mock routes #################
###############################################
@app.route('/api/v1/mock/setup', methods=['POST'])
def setupMockData():
    # This is a mock route to set up initial data in the database
    mongo_instance.isMock = True

    comments =  request.get_json['comments']
    restaurants = request.get_json['restaurants']
    clear_flag = request.get_json.get('clear', True)

    try:
        if clear_flag:
            mongo_instance.clear_database()
        else:
            print("Skipping clearing mock data")

        mongo_instance.setup_mock_data(comments, restaurants)
        return jsonify({'status': 'Mock data setup successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# To run app
if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_ENV') != 'production'
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8000)),debug=debug_mode)
    print("Flask app is running...")