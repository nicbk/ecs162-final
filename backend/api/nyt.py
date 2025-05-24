# Blueprints learned from class slides
import os
from flask import Blueprint, request, jsonify
# According to https://stackoverflow.com/questions/15463004/how-can-i-send-a-get-request-from-my-flask-app-to-another-site,
# the "requests" module is an elegant interface for making proxied HTTP requests.
# I will use it to make requests to the NYT API.
import requests
from werkzeug.exceptions import BadRequest
from requests.exceptions import JSONDecodeError

nyt = Blueprint(f'nyt', __name__)

###########################
## NYT schema for API v1 ##
###########################

NYT_API_KEY = os.getenv('NYT_API_KEY')
NYT_API_ENDPOINT = 'https://api.nytimes.com/svc/search/v2/articlesearch.json'

# GET <NYT root>/page
# Query args:
#   query: <string>
#   page: <number>
# returns:
#   [
#     {
#       title: string
#       content: string
#       link?: string
#       hasFigure?: boolean
#       figureUrl?: string
#       figureAlt?: string
#       figureCredit?: string
#     },
#     ...
#   ]
@nyt.route('/page', methods=['GET'])
def get_page():
    # I learned how to get query parameters from here: https://www.geeksforgeeks.org/get-request-query-parameters-with-flask/
    query = request.args.get('query')
    if query is None:
        raise BadRequest('Must specify a "query" field in the request parameters')

    page = request.args.get('page')
    if page is None:
        raise BadRequest('Must specify a "page" field in the request parameters')
    
    try:
        int(page)
    except ValueError:
        raise BadRequest('"page" field must be an integer')
    
    # According to https://proxiesapi.com/articles/working-with-query-parameters-in-python-requests
    # I can construct URL query parameters using a list of pairs.
    query_params = [
        ('api-key', NYT_API_KEY),
        ('q', query),
        ('page', page)
    ]
    
    nyt_response = requests.get(NYT_API_ENDPOINT, query_params)
    try:
        nyt_response.json()
    except JSONDecodeError:
        # Return empty array of NYT successfully returns but not with any article array
        return jsonify([])


    # According to https://pypi.org/project/requests/
    # I can get the JSON response as a dict
    articlesNyt = nyt_response.json()['response']['docs']

    if articlesNyt is None:
        return jsonify([])

    # List of articles to return
    articles = []

    for article in articlesNyt:
        newArticle = {}
        # Filter out any responses without a headline or abstract
        if 'headline' not in article:
            continue
        if 'abstract' not in article:
            continue
        if 'uri' not in article:
            continue
        
        newArticle['title'] = article['headline']['main']
        newArticle['content'] = article['abstract']
        # Get last section of URI path, which is the article UUID
        newArticle['id'] = article['uri'].split('/')[3]

        if 'web_url' in article:
            newArticle['link'] = article['web_url']
        
        if 'multimedia' in article:
            newArticle['hasFigure'] = True
            newArticle['figureUrl'] = article['multimedia']['default']['url']
            newArticle['figureAlt'] = article['multimedia']['caption']
            newArticle['figureCredit'] = article['multimedia']['credit']
        
        articles.append(newArticle)
    
    return jsonify(articles)