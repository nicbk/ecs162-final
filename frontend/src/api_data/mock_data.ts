//expecting the api to look like this with data given from the backend

import { type Restaurant, type Comment } from "../interface_data/index.ts";
import mock_food_mac from "../assets/MAC_Burger_mock_pic.jpg";
import in_and_out from "../assets/inandout.jpg";
import bonappetit from "../assets/bonappetit.png";

fetch('/api/v1/restaurant')
export const mockResturantsData: Restaurant[] = [
    {
        restaurantId: '1',
        restaurantTitle: "In-N-Out Burger",
        rating: 7.0,
        address: "234 Davis St",
        images: [bonappetit],
        googleMapsUrl: "google.com/maps/In-N-Out",
    },
    {
        restaurantId: '2',
        restaurantTitle: "MAC Burger",
        rating: 3.0,
        address: "543 Davis St",
        images: [mock_food_mac, "https://cdn.sanity.io/images/czqk28jt/prod_bk_us/5307fcecf8985c350677b2721122facddbf949c8-2000x1000.png?w=650&q=75&fit=max&auto=format"],
        googleMapsUrl: "google.com/maps/MAC",
    },
    {
        restaurantId: '3',
        restaurantTitle: "Taco Bell",
        rating: 10.0,
        address: "4444 Davis St",
        images: [in_and_out],
        googleMapsUrl: "google.com/maps/Taco",
    },

];
fetch('/api/v1/Comment')
export const mockPublish: Comment [] = [
    {
        id: '234',
        username: "ayub",
        body: "this is a comment",
        images: ["data:image/jpeg;base64,sdifjaijew", "data:image/jpeg;base64,aifwjwjefijawef"],
        likes: 15,
        deleted: false,
        replies: [
            {
                id: '2234341',
                username: "john",
                body: "I am a reply",
                images: ["data:image/jpeg;base64,sdifjaijew", "data:image/jpeg;base64,aifwjwjefijawef"],
                likes: 2,
                deleted: false,
                replies: []
            }
        ]
    },
        {
        id: '222222',
        username: "sam",
        body: "food was good",
        images: ["data:image/jpeg;base64,jjfgtr", "data:image/jpeg;base64,hgffg"],
        likes: 1,
        deleted: false,
        replies: [
            {
                id: '2234341',
                username: "john",
                body: "lies this is a lie, it was bad",
                images: ["data:image/jpeg;base64,drtfdghfghd", "data:image/jpeg;base64,fghhgf"],
                likes: 13,
                deleted: false,
                replies: []
            }
        ]
    },
];