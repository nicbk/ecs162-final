from flask import Flask, request, jsonify, send_from_directory, redirect, url_for, session
from authlib.integrations.flask_client import OAuth
from authlib.common.security import generate_token
import os
from flask_cors import CORS
import werkzeug
from pymongo import MongoClient
from api import api, API_VERSION

#####################
### BACKEND SETUP ###
#####################

static_path = os.getenv('STATIC_PATH','static')
template_path = os.getenv('TEMPLATE_PATH','templates')

app = Flask(__name__, static_folder=static_path, template_folder=template_path)
CORS(app)

# NOTE: OAuth setup is copied from the updated starter code
# 'secret_key' field on flask app is needed for cryptographically signing cookies https://flask.palletsprojects.com/en/stable/quickstart/#sessions
# This allows the Dex OIDC session information to be set in a cryptographically tamper-proof cookie on the client's browser.
app.secret_key = os.urandom(24)

oauth = OAuth(app)
# Dex uses a nonce to prevent replay attacks https://dexidp.io/docs/guides/using-dex/
nonce = generate_token()

# This code block for setting up the flask OIDC interface to Dex is also copied from starter code
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

# I learn about how to handle errors with the following documentation
# https://flask.palletsprojects.com/en/stable/errorhandling/
@app.errorhandler(werkzeug.exceptions.BadRequest)
def bad_request_handler(err):
    return str(err), 400

####################
## BACKEND ROUTES ##
####################

# Register the API blueprint
app.register_blueprint(api, url_prefix=f'/api/{API_VERSION}')

# Path to serve frontend resources
@app.route('/')
@app.route('/<path:path>')
def serve_frontend(path=''):
    if path != '' and os.path.exists(os.path.join(static_path,path)):
        return send_from_directory(static_path, path)
    return send_from_directory(template_path, 'index.html')

# Path for authentication login redirect 
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
    if 'originUrl' in session:
        return redirect(session['originUrl'])
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

# To run app
if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_ENV') != 'production'
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8000)),debug=debug_mode)