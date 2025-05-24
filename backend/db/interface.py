# NOTE: The following code is taken and inspired from the lecture slides on MongoDB w/ Flask
#  in order to implement an abstract interface for data access.
from abc import ABC, abstractmethod
from db.data import Resource, Comment

class DBInterface(ABC):
    # Get comment count for a resource
    # A resource_id is defined as either an article_id or a comment_id
    # param resource_id: UUID of resource
    # returns: count
    @abstractmethod
    def get_resource_comment_count(self, resource_id: str) -> int:
        pass

    # Get a resource
    # A resource_id is defined as either an article_id or a comment_id
    # param resource_id: UUID of resource
    # returns: Resource
    @abstractmethod
    def get_resource(self, resource_id: str) -> Resource:
        pass

    # Create a comment
    # param parent_id: UUID of parent resource
    # param comment: comment content
    # returns: Nothing
    @abstractmethod
    def create_comment(self, parent_id: str, comment: Comment) -> None:
        pass

    # Delete a comment
    # param comment_id: UUID of comment
    # returns: Nothing
    # This method should set a flag in the database that specifies the comment is deleted.
    # When the get_resource() call constructs a tree of comments, then comments specified as deleted will
    # have the body containing a default deleted message.
    @abstractmethod
    def delete_comment(self, comment_id: str) -> None:
        pass