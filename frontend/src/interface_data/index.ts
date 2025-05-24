//This wil be used for the data interfaces and also fields that we will get from the backend for now it is all mock data

export interface Restaurant {
    id: string;
    name: string;
    Url: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    phone_number: string;
    website: string;
}
export interface Publish { 
    id: string;
    title: string;
    content: string;
}