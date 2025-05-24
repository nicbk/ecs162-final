import pytest
import mongomock
import re
from unittest.mock import patch

###############
## API Setup ##
###############

NYT_API_ENDPOINT='https://api.nytimes.com/svc/search/v2/articlesearch.json'

# I take code from this GitHub comment chain https://github.com/mongomock/mongomock/issues/862
# in order to figure out how to get a fresh mocked mongo client that I can reset
@pytest.fixture(scope='session')
def fresh_mongo_client():
    # Create an inmemory MongoDB client for testing
    return mongomock.MongoClient()

# Apply this fixture ot all tests
@pytest.fixture()
def patch_mongo(fresh_mongo_client):
    # Patch MongoClient before app import
    with patch('pymongo.MongoClient', return_value=fresh_mongo_client):
        # Now when code uses database, it will use the mock database
        import app as flask_app
        yield flask_app

# Create a mock MongoDB client
@pytest.fixture
def client(patch_mongo):
    # Use the app that was imported with mocked MongoDB
    flask_app = patch_mongo
    flask_app.app.config['TESTING'] = True
    with flask_app.app.test_client() as client:
        yield client

####################
## User API Tests ##
####################

def test_get_user_no_jwt_session(client):
    response = client.get('/api/v1/user', json={})
    assert response.status_code == 200
    data = response.get_json()
    assert data == {
        'logged_in': False,
    }

def test_get_user_no_user(client):
    with client.session_transaction() as session:
        session['user'] = {
            'email': 'test@test.com'
        }

    response = client.get('/api/v1/user', json={})
    assert response.status_code == 200
    data = response.get_json()
    assert data == {
        'logged_in': False,
    }

def test_get_user_no_email(client):
    with client.session_transaction() as session:
        session['user'] = {
            'name': 'user',
        }

    response = client.get('/api/v1/user', json={})
    assert response.status_code == 200
    data = response.get_json()
    assert data == {
        'logged_in': False,
    }

def test_get_user_no_sub(client):
    with client.session_transaction() as session:
        session['user'] = {
            'name': 'user',
            'email': 'test@test.com'
        }

    response = client.get('/api/v1/user', json={})
    assert response.status_code == 200
    data = response.get_json()
    assert data == {
        'logged_in': False,
    }

def test_get_user(client):
    with client.session_transaction() as session:
        session['user'] = {
            'sub': 'test_sub',
            'name': 'user',
            'email': 'test@test.com'
        }

    response = client.get('/api/v1/user', json={})
    assert response.status_code == 200
    data = response.get_json()
    assert data == {
        'logged_in': True,
        'name': 'user',
        'email': 'test@test.com'
    }

###################
## NYT API Tests ##
###################

def test_nyt_query_no_params(client):
    response = client.get('/api/v1/nyt/page', json={})
    assert response.status_code == 400
    assert response.text == '400 Bad Request: Must specify a "query" field in the request parameters'

def test_nyt_query_no_query(client):
    response = client.get('/api/v1/nyt/page?page=5', json={})
    assert response.status_code == 400
    assert response.text == '400 Bad Request: Must specify a "query" field in the request parameters'

def test_nyt_query_no_page(client):
    response = client.get('/api/v1/nyt/page?query=sacramento', json={})
    assert response.status_code == 400
    assert response.text == '400 Bad Request: Must specify a "page" field in the request parameters'

def test_nyt_query_non_integer_page(client):
    response = client.get('/api/v1/nyt/page?query=sacramento&page=asdf', json={})
    assert response.status_code == 400
    assert response.text == '400 Bad Request: "page" field must be an integer'

def test_nyt_query_success_page_0(client, requests_mock):
    # I use requests-mock https://requests-mock.readthedocs.io/en/latest/pytest.html
    # in order to mock requests
    example_article = {
        'headline': {
            'main': 'test title'
        },
        'abstract': 'test content',
        'uri': 'nyt://article/e8ca551b-de91-5e8b-b2ac-2b9350e12ef0'
    }

    example_response = {
        'response': {
            'docs': [example_article for _ in range(10)]
        }
    }

    # I use a regex to catchall api keys, as shown here https://stackoverflow.com/questions/69179740/python-mock-requests-can-i-use-wildcards-in-the-url-parameter-of-the-mocker-ho
    mock_url = re.compile(NYT_API_ENDPOINT + r'\?api-key=.*q=UC\+Davis\+Sacramento&page=0')

    requests_mock.get(mock_url, json=example_response)

    # According to https://stackoverflow.com/questions/5442658/spaces-in-urls
    # I use "%20" to represent a space in an HTTP query
    response = client.get('/api/v1/nyt/page?query=UC%20Davis%20Sacramento&page=0', json={})
    assert response.status_code == 200
    data = response.get_json()
    # NYT API returns many results for UCD and Sacramento
    assert len(data) > 5

    example_result = data[0]
    assert 'title' in example_result
    assert 'content' in example_result
    assert example_result['id'] == 'e8ca551b-de91-5e8b-b2ac-2b9350e12ef0'

def test_nyt_query_success_page_1(client, requests_mock):
    # I use requests-mock https://requests-mock.readthedocs.io/en/latest/pytest.html
    # in order to mock requests
    example_article = {
        'headline': {
            'main': 'test title'
        },
        'abstract': 'test content',
        'uri': 'nyt://article/e8ca551b-de91-5e8b-b2ac-2b9350e12ef0'
    }

    example_response = {
        'response': {
            'docs': [example_article for _ in range(10)]
        }
    }

    # I use a regex to catchall api keys, as shown here https://stackoverflow.com/questions/69179740/python-mock-requests-can-i-use-wildcards-in-the-url-parameter-of-the-mocker-ho
    mock_url = re.compile(NYT_API_ENDPOINT + r'\?api-key=.*q=UC\+Davis\+Sacramento&page=1')

    requests_mock.get(mock_url, json=example_response)

    # According to https://stackoverflow.com/questions/5442658/spaces-in-urls
    # I use "%20" to represent a space in an HTTP query
    response = client.get('/api/v1/nyt/page?query=UC%20Davis%20Sacramento&page=1', json={})
    assert response.status_code == 200
    data = response.get_json()
    # NYT API returns many results for UCD and Sacramento
    assert len(data) > 5

    example_result = data[0]
    assert 'title' in example_result
    assert 'content' in example_result
    assert example_result['id'] == 'e8ca551b-de91-5e8b-b2ac-2b9350e12ef0'

def test_nyt_query_success_massive_page_num(client, requests_mock):
    # I use requests-mock https://requests-mock.readthedocs.io/en/latest/pytest.html
    # in order to mock requests

    # I use a regex to catchall api keys, as shown here https://stackoverflow.com/questions/69179740/python-mock-requests-can-i-use-wildcards-in-the-url-parameter-of-the-mocker-ho
    mock_url = re.compile(NYT_API_ENDPOINT + r'\?api-key=.*q=UC\+Davis\+Sacramento&page=999999')

    # Mock having no JSON response for high page number
    requests_mock.get(mock_url, text='No articles returned')

    # According to https://stackoverflow.com/questions/5442658/spaces-in-urls
    # I use "%20" to represent a space in an HTTP query
    response = client.get('/api/v1/nyt/page?query=UC%20Davis%20Sacramento&page=999999', json={})
    assert response.status_code == 200
    data = response.get_json()
    # API handler returns empty string when NYT API returns no responses
    assert len(data) == 0

def test_nyt_query_success_no_results(client, requests_mock):
    # I use requests-mock https://requests-mock.readthedocs.io/en/latest/pytest.html
    # in order to mock requests
    example_response = {
        'response': {
            'docs': [] # No documents returned
        }
    }

    # I use a regex to catchall api keys, as shown here https://stackoverflow.com/questions/69179740/python-mock-requests-can-i-use-wildcards-in-the-url-parameter-of-the-mocker-ho
    mock_url = re.compile(NYT_API_ENDPOINT + r'\?api-key=.*q=aisdjfijijaijewifjiwef&page=1')

    requests_mock.get(mock_url, json=example_response)

    # According to https://stackoverflow.com/questions/5442658/spaces-in-urls
    # I use "%20" to represent a space in an HTTP query
    response = client.get('/api/v1/nyt/page?query=aisdjfijijaijewifjiwef&page=1', json={})
    assert response.status_code == 200
    data = response.get_json()
    # API handler returns empty string when NYT API returns no responses
    assert len(data) == 0

########################
## Comments API Tests ##
########################

# Randomly generated UUIDv4
TEST_UUID = '726a48d1-09c8-4c5b-9403-6304a0184e9e'

def test_comment_get_article_count_empty(client):
    response = client.get(f'/api/v1/resource/{TEST_UUID}/count', json={})
    assert response.status_code == 200
    assert response.text == '0\n'

def test_comment_get_article_empty(client):
    response = client.get(f'/api/v1/resource/{TEST_UUID}', json={})
    assert response.status_code == 200
    assert response.get_json() == {
        'comments': [],
        'resource_id': TEST_UUID
    }

def test_insert_comment_no_parent_id(client):
    response = client.post(f'/api/v1/comment', json={})
    assert response.status_code == 400
    assert response.text == '400 Bad Request: Request must include a "parent_id" field in the JSON body'

def test_insert_comment_no_body(client):
    response = client.post(f'/api/v1/comment', json={
        'parent_id': TEST_UUID
    })
    assert response.status_code == 400
    assert response.text == '400 Bad Request: Request must include a "body" field in the JSON body'

def test_insert_comment_no_session_cookie(client):
    response = client.post(f'/api/v1/comment', json={
        'parent_id': TEST_UUID,
        'body': 'test body'
    })
    assert response.status_code == 400
    assert response.text == '400 Bad Request: User must be authenticated in order to post a comment'

def test_insert_comment_empty_parent_id(client):
    with client.session_transaction() as session:
        session['user'] = {
            'sub': 'test_sub',
            'name': 'test_name'
        }

    response = client.post(f'/api/v1/comment', json={
        'parent_id': '',
        'body': 'test body'
    })
    assert response.status_code == 400
    assert response.text == '400 Bad Request: "parent_id" field must be non-empty'

def test_insert_comment_empty_body(client):
    with client.session_transaction() as session:
        session['user'] = {
            'sub': 'test_sub',
            'name': 'test_name'
        }

    response = client.post(f'/api/v1/comment', json={
        'parent_id': TEST_UUID,
        'body': ''
    })
    assert response.status_code == 400
    assert response.text == '400 Bad Request: "body" field must be non-empty'

def test_insert_comment(client, fresh_mongo_client):
    # Drop database on each test
    fresh_mongo_client.drop_database('mydatabase')

    # Insert comment
    with client.session_transaction() as session:
        session['user'] = {
            'sub': 'test_sub',
            'name': 'test_name'
        }

    response = client.post(f'/api/v1/comment', json={
        'parent_id': TEST_UUID,
        'body': 'Test comment content'
    })
    assert response.status_code == 200

    # Get comment count
    response = client.get(f'/api/v1/resource/{TEST_UUID}/count', json={})
    assert response.status_code == 200
    assert response.text == '1\n'

    # Get comments
    response = client.get(f'/api/v1/resource/{TEST_UUID}', json={})

    assert response.status_code == 200
    assert response.get_json() == {
        'comments': [
            {
                'comment_id': response.get_json()['comments'][0]['comment_id'],
                'user_id': 'test_sub',
                'user_name': 'test_name',
                'body': 'Test comment content',
                'is_deleted': False,
                'replies': []
            }
        ],
        'resource_id': TEST_UUID
    }

def test_insert_two_comments_reply(client, fresh_mongo_client):
    # Drop database on each test
    fresh_mongo_client.drop_database('mydatabase')

    with client.session_transaction() as session:
        session['user'] = {
            'sub': 'test_sub',
            'name': 'test_name'
        }

    # Insert comment 1
    response = client.post(f'/api/v1/comment', json={
        'parent_id': TEST_UUID,
        'body': 'Test comment content'
    })
    assert response.status_code == 200

    response1 = client.get(f'/api/v1/resource/{TEST_UUID}', json={})
    # Get UUID of first comment
    comment_1_uuid = response1.get_json()['comments'][0]['comment_id']

    # Insert comment 2
    response = client.post(f'/api/v1/comment', json={
        'parent_id': TEST_UUID,
        'body': 'Test comment content 2'
    })
    assert response.status_code == 200

    # Insert comment reply
    response = client.post(f'/api/v1/comment', json={
        'parent_id': comment_1_uuid,
        'body': 'Test comment content reply'
    })
    assert response.status_code == 200

    # Get comment count
    response = client.get(f'/api/v1/resource/{TEST_UUID}/count', json={})
    assert response.status_code == 200
    assert response.text == '3\n'

    # Get comments
    response = client.get(f'/api/v1/resource/{TEST_UUID}', json={})

    assert response.status_code == 200
    assert response.get_json() == {
        'comments': [
            {
                'comment_id': response.get_json()['comments'][0]['comment_id'],
                'user_id': 'test_sub',
                'user_name': 'test_name',
                'body': 'Test comment content',
                'is_deleted': False,
                'replies': [
                    {
                        'comment_id': response.get_json()['comments'][0]['replies'][0]['comment_id'],
                        'user_id': 'test_sub',
                        'user_name': 'test_name',
                        'body': 'Test comment content reply',
                        'is_deleted': False,
                        'replies': []
                    }
                ]
            },
            {
                'comment_id': response.get_json()['comments'][1]['comment_id'],
                'user_id': 'test_sub',
                'user_name': 'test_name',
                'body': 'Test comment content 2',
                'is_deleted': False,
                'replies': []
            }
        ],
        'resource_id': TEST_UUID
    }

def test_insert_two_comments_reply_delete(client, fresh_mongo_client):
    # Drop database on each test
    fresh_mongo_client.drop_database('mydatabase')

    with client.session_transaction() as session:
        session['user'] = {
            'sub': 'test_sub',
            'name': 'moderator'
        }

    # Insert comment 1
    response = client.post(f'/api/v1/comment', json={
        'parent_id': TEST_UUID,
        'body': 'Test comment content'
    })
    assert response.status_code == 200

    response1 = client.get(f'/api/v1/resource/{TEST_UUID}', json={})
    # Get UUID of first comment
    comment_1_uuid = response1.get_json()['comments'][0]['comment_id']

    # Insert comment 2
    response = client.post(f'/api/v1/comment', json={
        'parent_id': TEST_UUID,
        'body': 'Test comment content 2'
    })
    assert response.status_code == 200

    # Insert comment reply
    response = client.post(f'/api/v1/comment', json={
        'parent_id': comment_1_uuid,
        'body': 'Test comment content reply'
    })
    assert response.status_code == 200

    # Delete first comment
    response = client.post(f'/api/v1/comment/{comment_1_uuid}/delete', json={})
    assert response.status_code == 200

    # Get comment count
    response = client.get(f'/api/v1/resource/{TEST_UUID}/count', json={})
    assert response.status_code == 200
    assert response.text == '3\n'

    # Get comments
    response = client.get(f'/api/v1/resource/{TEST_UUID}', json={})

    assert response.status_code == 200
    assert response.get_json() == {
        'comments': [
            {
                'comment_id': response.get_json()['comments'][0]['comment_id'],
                'user_id': 'test_sub',
                'user_name': 'moderator',
                'body': 'Comment was removed by moderator',
                'is_deleted': True,
                'replies': [
                    {
                        'comment_id': response.get_json()['comments'][0]['replies'][0]['comment_id'],
                        'user_id': 'test_sub',
                        'user_name': 'moderator',
                        'body': 'Test comment content reply',
                        'is_deleted': False,
                        'replies': []
                    }
                ]
            },
            {
                'comment_id': response.get_json()['comments'][1]['comment_id'],
                'user_id': 'test_sub',
                'user_name': 'moderator',
                'body': 'Test comment content 2',
                'is_deleted': False,
                'replies': []
            }
        ],
        'resource_id': TEST_UUID
    }

def test_delete_comment_user(client, fresh_mongo_client):
    # Drop database on each test
    fresh_mongo_client.drop_database('mydatabase')

    with client.session_transaction() as session:
        session['user'] = {
            'sub': 'test_sub',
            # Regular user - deletion should fail
            'name': 'user'
        }

    # Insert comment
    response = client.post(f'/api/v1/comment', json={
        'parent_id': TEST_UUID,
        'body': 'Test comment content'
    })
    assert response.status_code == 200

    response1 = client.get(f'/api/v1/resource/{TEST_UUID}', json={})
    # Get UUID of first comment
    comment_1_uuid = response1.get_json()['comments'][0]['comment_id']

    # Delete first comment
    response = client.post(f'/api/v1/comment/{comment_1_uuid}/delete', json={})
    assert response.status_code == 400
    assert response.text == '400 Bad Request: User must be authenticated as moderator or administrator in order to delete a comment'

def test_delete_comment_moderator(client, fresh_mongo_client):
    # Drop database on each test
    fresh_mongo_client.drop_database('mydatabase')

    with client.session_transaction() as session:
        session['user'] = {
            'sub': 'test_sub',
            # Moderator - deletion should succeed
            'name': 'moderator'
        }

    # Insert comment
    response = client.post(f'/api/v1/comment', json={
        'parent_id': TEST_UUID,
        'body': 'Test comment content'
    })
    assert response.status_code == 200

    response1 = client.get(f'/api/v1/resource/{TEST_UUID}', json={})
    # Get UUID of first comment
    comment_1_uuid = response1.get_json()['comments'][0]['comment_id']

    # Delete first comment
    response = client.post(f'/api/v1/comment/{comment_1_uuid}/delete', json={})
    assert response.status_code == 200

    # Get comments
    response = client.get(f'/api/v1/resource/{TEST_UUID}', json={})

    assert response.status_code == 200
    assert response.get_json() == {
        'comments': [
            {
                'comment_id': response.get_json()['comments'][0]['comment_id'],
                'user_id': 'test_sub',
                'user_name': 'moderator',
                'body': 'Comment was removed by moderator',
                'is_deleted': True,
                'replies': []
            }
        ],
        'resource_id': TEST_UUID
    }

def test_delete_comment_admin(client, fresh_mongo_client):
    # Drop database on each test
    fresh_mongo_client.drop_database('mydatabase')

    with client.session_transaction() as session:
        session['user'] = {
            'sub': 'test_sub',
            # Admin - deletion should succeed
            'name': 'admin'
        }

    # Insert comment
    response = client.post(f'/api/v1/comment', json={
        'parent_id': TEST_UUID,
        'body': 'Test comment content'
    })
    assert response.status_code == 200

    response1 = client.get(f'/api/v1/resource/{TEST_UUID}', json={})
    # Get UUID of first comment
    comment_1_uuid = response1.get_json()['comments'][0]['comment_id']

    # Delete first comment
    response = client.post(f'/api/v1/comment/{comment_1_uuid}/delete', json={})
    assert response.status_code == 200

    # Get comments
    response = client.get(f'/api/v1/resource/{TEST_UUID}', json={})

    assert response.status_code == 200
    assert response.get_json() == {
        'comments': [
            {
                'comment_id': response.get_json()['comments'][0]['comment_id'],
                'user_id': 'test_sub',
                'user_name': 'admin',
                'body': 'Comment was removed by moderator',
                'is_deleted': True,
                'replies': []
            }
        ],
        'resource_id': TEST_UUID
    }