import { type Restaurant, type Comment } from "../interface_data/index.ts";

//fetch('/api/v1/restaurant')
export const mockResturantsData: Restaurant[] = [
    {
        restaurantId: '1',
        restaurantTitle: "In-N-Out Burger",
        rating: 7.0,
        address: "234 Davis St",
        images: ["https://www.in-n-out.com/ResourcePackages/INNOUT/content/images/menu/cheeseburger-meal.png?package=INNOUT&v=2023"],
        googleMapsUrl: "google.com/maps/In-N-Out",
    },
    {
        restaurantId: '2',
        restaurantTitle: "MAC Burger",
        rating: 3.0,
        address: "543 Davis St",
        images: ["https://s7d1.scene7.com/is/image/mcdonalds/1PUB_bestburger_trendingnow:1-column-desktop?resmode=sharp2", "https://cdn.sanity.io/images/czqk28jt/prod_bk_us/5307fcecf8985c350677b2721122facddbf949c8-2000x1000.png?w=650&q=75&fit=max&auto=format"],
        googleMapsUrl: "google.com/maps/MAC",
    },
    {
        restaurantId: '3',
        restaurantTitle: "Taco Bell",
        rating: 10.0,
        address: "4444 Davis St",
        images: ["https://www.tacobell.com/images/22813_cheesy_gordita_crunch_750x340.jpg"],
        googleMapsUrl: "google.com/maps/Taco",
    },

];

//fetch('/api/v1/Comment')
export const mockPublish: Comment [] = [
    {
        id: '234',
        username: "ayub",
        body: "this is a comment",
        images: ["https://www.foodiesfeed.com/wp-content/uploads/2023/06/burger-with-melted-cheese.jpg", "https://www.foodiesfeed.com/wp-content/uploads/2023/03/bacon-cheeseburger-close-up.jpg"],
        likes: 15,
        rating: NaN,
        deleted: false,
        replies: [
            {
                id: '2234341',
                username: "john",
                body: "I am a reply",
                images: ["https://thumbs.dreamstime.com/b/unhealthy-fast-food-delivery-menu-featuring-assorted-burgers-cheeseburgers-nuggets-french-fries-soda-high-calorie-low-356045884.jpg",
                     "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=2020&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"],
                likes: 2,
                rating: 5,
                deleted: false,
                replies: [
                    { 
                    id: '2234342342',
                    username: "jane",
                    body: "bruh",
                    images: ["https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg",
                         "https://static.vecteezy.com/system/resources/thumbnails/037/236/579/small/ai-generated-beautuful-fast-food-background-with-copy-space-free-photo.jpg"],
                    likes: 0,
                    deleted: false,
                    rating: 5,
                    replies: [],
                    parentId: '2234341'
                    },
                    { 
                    id: '23',
                    username: "lol",
                    body: "come on this is not that bad I thought it was good",
                    images: ["https://media.istockphoto.com/id/1829241109/photo/enjoying-a-brunch-together.jpg?b=1&s=612x612&w=0&k=20&c=Mn_EPBAGwtzh5K6VyfDmd7Q5eJFXSHhGWVr3T4WDQRo=",
                         "https://media.istockphoto.com/id/1457433817/photo/group-of-healthy-food-for-flexitarian-diet.jpg?s=612x612&w=0&k=20&c=v48RE0ZNWpMZOlSp13KdF1yFDmidorO2pZTu2Idmd3M="],
                    likes: 10,
                    rating: 5,
                    deleted: false,
                    replies: [],
                    parentId: '2234341'
                    }
                ],
                parentId: '234'
            },
            {
                id: '1111321',
                username: "lazysan",
                body: "my reply to your reply",
                images: ["data:image/jpeg;base64,sdsddssd", "data:image/jpeg;base64,sdfgggggggg"],
                likes: 2,
                rating: 5,
                deleted: false,
                replies: [],
                parentId: '234'
            }
        ],
        parentId: '1'
    },
    {
        id: '222222',
        username: "sam",
        body: "food was good",
        images: ["https://www.foodiesfeed.com/wp-content/uploads/2023/05/avocado-bacon-bagel.jpg", "https://media.istockphoto.com/id/1699248018/photo/bagel-toast-with-avocado-and-guacamole.jpg?s=2048x2048&w=is&k=20&c=1SGjXICCVT6nuvGnNRJsKClGqk04orK_mN7F58AaKyg="],
        likes: 1,
        rating: NaN,
        deleted: false,
        replies: [
            {
                id: '2234341',
                username: "john",
                body: "lies this is a lie, it was bad",
                images: ["data:image/jpeg;base64,drtfdghfghd", "data:image/jpeg;base64,fghhgf"],
                likes: 13,
                deleted: false,
                rating: 5,
                replies: [],
                parentId: '222222'
            }
        ],
        parentId: '1',
    },
    {
        id: '546457',
        username: "tim",
        body: "this is a comment",
        images: ["https://www.foodiesfeed.com/wp-content/uploads/2023/06/burger-with-melted-cheese.jpg", "https://www.foodiesfeed.com/wp-content/uploads/2023/03/bacon-cheeseburger-close-up.jpg"],
        likes: 15,
        rating: NaN,
        deleted: false,
        replies: [
            {
                id: '2234341',
                username: "john",
                body: "I am a reply",
                images: ["data:image/jpeg;base64,sdifjaijew", "data:image/jpeg;base64,aifwjwjefijawef"],
                likes: 2,
                rating: 5,
                deleted: false,
                replies: [
                    {
                        id: '1111321',
                        username: "lazysan",
                        body: "my reply to your reply",
                        images: ["data:image/jpeg;base64,ffffffff", "data:image/jpeg;base64,ffffffff"],
                        likes: 2,
                        rating: 5,
                        deleted: false,
                        replies: [],
                        parentId: '2234341'
                    }
                ],
                parentId: '546457'
            }
        ],
        parentId: '2'
    },
    {
        id: '6454545454',
        username: "matt",
        body: "food was good",
        images: [],
        likes: 11,
        rating: NaN,
        deleted: false,
        replies: [
            {
                id: '2234341',
                username: "john",
                body: "lies this is a lie, it was bad",
                images: ["data:image/jpeg;base64,drtfdghfghd", "data:image/jpeg;base64,fghhgf"],
                likes: 13,
                deleted: false,
                rating: 5,
                replies: [],
                parentId: '6454545454'
            }
        ],
        parentId: '3',
    },
    {
        id: '23452',
        username: "forest",
        body: "food was good",
        images: ["https://www.foodiesfeed.com/wp-content/uploads/2023/05/avocado-bacon-bagel.jpg", "https://media.istockphoto.com/id/1699248018/photo/bagel-toast-with-avocado-and-guacamole.jpg?s=2048x2048&w=is&k=20&c=1SGjXICCVT6nuvGnNRJsKClGqk04orK_mN7F58AaKyg="],
        likes: 1,
        rating: NaN,
        deleted: false,
        replies: [
            {
                id: '2234341',
                username: "john",
                body: "lies this is a lie, it was bad",
                images: ["data:image/jpeg;base64,drtfdghfghd", "data:image/jpeg;base64,fghhgf"],
                likes: 13,
                deleted: false,
                rating: 5,
                replies: [],
                parentId: '23452'
            }
        ],
        parentId: '1'
    },
    {
        id: '65476',
        username: "louis",
        body: "food was good",
        images: ["https://www.foodiesfeed.com/wp-content/uploads/2023/05/avocado-bacon-bagel.jpg", "https://media.istockphoto.com/id/1699248018/photo/bagel-toast-with-avocado-and-guacamole.jpg?s=2048x2048&w=is&k=20&c=1SGjXICCVT6nuvGnNRJsKClGqk04orK_mN7F58AaKyg="],
        likes: 1,
        rating: NaN,
        deleted: false,
        replies: [
            {
                id: '2234341',
                username: "lol",
                body: "lies this is a lie, it was bad",
                images: ["data:image/jpeg;base64,drtfdghfghd", "data:image/jpeg;base64,fghhgf"],
                likes: 13,
                deleted: false,
                rating: 5,
                replies: [],
                parentId: '65476'
            }
        ],
        parentId: '2'
    },
    {
        id: '11111111',
        username: "smith",
        body: "Boring food",
        images: ["https://www.foodiesfeed.com/wp-content/uploads/2023/05/avocado-bacon-bagel.jpg", "https://media.istockphoto.com/id/1699248018/photo/bagel-toast-with-avocado-and-guacamole.jpg?s=2048x2048&w=is&k=20&c=1SGjXICCVT6nuvGnNRJsKClGqk04orK_mN7F58AaKyg="],
        likes: 1,
        deleted: false,
        rating: NaN,
        replies: [],
        parentId: '3',
    }
];