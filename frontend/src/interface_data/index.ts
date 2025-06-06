//This wil be used for the data interfaces and also fields that we will get from the backend for now it is all mock data

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
    deleted: boolean;
    replies: Comment[];
    restaurantId?: string;
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
}