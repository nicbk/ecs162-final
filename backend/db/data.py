# NOTE: The following code is taken and inspired from the lecture slides on MongoDB w/ Flask
#  in order to implement backend data structures for data access.
from typing import NamedTuple

# A resource is either an article or a comment.
# In both cases, either resource contains a list of reply comments
class Resource(NamedTuple):
    resource_id: str
    # Forward declaration of type hints https://stackoverflow.com/questions/55320236/does-python-evaluate-type-hinting-of-a-forward-reference
    comments: list['Comment']

class Comment(NamedTuple):
    comment_id: str
    user_id: str
    user_name: str
    body: str
    is_deleted: bool
    # According to https://docs.python.org/3/library/typing.html
    # I type hint a list by doing "list[<base type name>]"
    # Recursive type definition since comment replies are a list of comments
    replies: list['Comment']