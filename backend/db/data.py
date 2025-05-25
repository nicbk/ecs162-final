# NOTE: The following code is taken and inspired from the lecture slides on MongoDB w/ Flask
#  in order to implement backend data structures for data access.
from typing import NamedTuple

# A resource is either an article or a comment.
# In both cases, either resource contains a list of reply comments
class Resource(NamedTuple):
    resource_id: str
    # Forward declaration of type hints https://stackoverflow.com/questions/55320236/does-python-evaluate-type-hinting-of-a-forward-reference
    comments: list['Comment']

class User(NamedTuple):
    username: str
    email: str
    oauth_id: str
    # wish_list: list[str] # List of image IDs, optional

class Image(NamedTuple):
    id: str
    data: str

class Comment(NamedTuple):
    parent_id: str
    id: str
    creator_id: str
    images: list[str] # List of image IDs
    body: str
    likes: int
    deleted: bool
    date: str

