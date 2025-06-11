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
    likedComments: set[str]

class Image(NamedTuple):
    id: str
    data: str

class Comment(NamedTuple):
    parentId: str
    id: str
    creatorId: str
    username: str
    rating: float
    images: list[str]
    body: str
    likes: set[str]
    deleted: bool
    date: str
    replies: list['Comment']  # List of reply comments

class Location(NamedTuple):
    latitude: float
    longitude: float

class PriceRange(NamedTuple):
    currency: str
    startPrice: str
    endPrice: str

class Restaurant(NamedTuple):
    id: str
    displayName: str
    formattedAddress: str
    location: Location
    rating: float
    googleMapsUri: str
    regularOpeningHours: dict
    priceLevel: str
    priceRange: dict
    takeout: bool
    delivery: bool
    dineIn: bool
    images: list[Image]


