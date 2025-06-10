//This wil be used for the data interfaces and also fields that we will get from the backend for now it is all mock data

import { getLoggedInUser } from "../api_data/client";
import type { UserAuthState } from "../global_state/global_state";

export type Base64Data = string; // example: [ 'data:image/jpeg;base64,sdifjaijewfijaisefjawje9fja8wjef...', 'data:image/jpeg;base64,aifwjwjefijaweifjaiwejf' ]
export type CommentId = string; // UUID of a comment

export interface Restaurant {
    restaurantId: string;
    restaurantTitle: string;
    rating: number;
    address: string;
    images: Base64Data[];
    googleMapsUrl: string;
}

export interface Comment { 
    id: string;
    username: string;
    body: string;
    images: Base64Data[];
    likes: number;
    rating?: number;
    deleted: boolean;
    replies: Comment[];
    parentId: string;
}

export interface InputComment {
    body: string;
    rating: number;
    images: Base64Data[];
}

export interface User {
    username: string;
    profileImage: Base64Data;
    bio: string;
    comments: CommentId[];
    likedComments: Set<CommentId>;
}

// I learn how to implement an interface type-checker from this response:
// https://stackoverflow.com/questions/14425568/interface-type-check-with-typescript
export const isUser = (obj: any): obj is User => {
    if (typeof obj === 'object' && 'username' in obj) {
        return true;
    } else {
        return false;
    }
};

export const isCommentTopLevel = (comment: Comment) => {
    if (!comment.rating || Number.isNaN(comment.rating)) {
        return false;
    } else {
        return true;
    }
};

export const didUserLikeComment = (user: UserAuthState, commentId: string) => {
    if (!isUser(user)) {
        return false;
    }

    return ((user as User).likedComments.has(commentId));
};