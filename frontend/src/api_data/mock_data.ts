//expecting the api to look like this with data given from the backend

import { type Restaurant, type Publish } from "../interface_data/index.ts";

fetch('/api/v3/restaurant')
export const mockResturantsData: Restaurant[] = [
    {
        id: '1',
        name: "In-N-Out Burger",
        Url: "https://image.com.jpg",
        address: "234 Davis St",
        city: "Davis",
        state: "CA",
        zip_code: "92342",
        phone_number: "234-234-2342",
        website: "www.Mockdata.com",    },
    {
        id: '2',
        name: "MAC Burger",
        Url: "https://image.com.jpg",
        address: "543 Davis St",
        city: "Davis",
        state: "CA",
        zip_code: "23423",
        phone_number: "233-2134-2412",
        website: "www.Mockdata.com",
    },
    {
        id: '3',
        name: "Taco Bell",
        Url: "https://image.com.jpg",
        address: "4444 Davis St",
        city: "Davis",
        state: "CA",
        zip_code: "66666",
        phone_number: "544-234-2542",
        website: "www.Mockdata.com",
    },

];
fetch('/api/v3/Publish')
export const mockPublish: Publish [] = [
    {
        id:'234',
        title: "resturant post",
        content: "come get your food!!!",
    },
    {
        id:'235',
        title: "resturant post#2",
        content: "I Love pizza!!!",
    },
    {
        id:'236',
        title: "resturant post#3",
        content: "new opening!!!",
    },
    {
        id:'237',
        title: "resturant post#4",
        content: "IDK yet!!!",
    },

];