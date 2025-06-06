# NOTE: The following code is taken and inspired from the lecture slides on MongoDB w/ Flask
#  in order to implement backend data structures for data access.
from typing import NamedTuple

class User(NamedTuple):
    username: str
    email: str
    oauthId: str
    profileImage: str
    bio: str
    wishList: list[str]

class Image(NamedTuple):
    id: str
    data: str

class Comment(NamedTuple):
    parentId: str
    id: str
    creatorId: str
    rating: float
    images: list[str]
    body: str
    likes: set[str]
    deleted: bool
    date: str
    replies: list['Comment']  # List of reply comments

# /api/v1/authed-user
# If logged in:
# {
# username: string
# bio: string
# profileImage: base64 encoded data URL
# comments: [list of comment IDs]
# }
