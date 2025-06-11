import type { UserAuthState } from "../global_state/global_state";

export type Base64Data = string;
export type CommentId = string; // UUID of a comment
export type RestaurantId = string; // UUID of a restaurant

// Price Levels https://googlemaps.github.io/google-maps-services-java/v0.1.17/javadoc/com/google/maps/model/PriceLevel.html
export type PriceLevel =
    | 'PRICE_LEVEL_FREE'
    | 'PRICE_LEVEL_INEXPENSIVE'
    | 'PRICE_LEVEL_MODERATE'
    | 'PRICE_LEVEL_EXPENSIVE'
    | 'PRICE_LEVEL_VERY_EXPENSIVE';

export interface Restaurant {
    restaurantId: string;
    restaurantTitle: string;
    rating: number;
    address: string;
    images: Base64Data[];
    googleMapsUrl: string;
}

export interface GoogleApiRestaurantResponse {
    id: string;
    displayName: string;
    formattedAddress: string;
    location: Object;
    rating: number;
    googleMapsUri: string;
    regularOpeningHours: Object;
    priceLevel: PriceLevel;
    priceRange: Object;
    takeout: boolean
    delivery: boolean;
    dineIn: boolean;
    images: Base64Data[];
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
    wishList: Set<RestaurantId>; // list of restaurant IDs
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

export const didUserWishRestaurant = (user: UserAuthState, restaurantId: string) => {
    if (!isUser(user)) {
        return false;
    }

    return ((user as User).wishList.has(restaurantId));
}