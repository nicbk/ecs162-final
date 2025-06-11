import os
from typing import Any
import requests
import json
import base64
from flask import jsonify

GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
GOOGLE_PLACES_ENDPOINT = 'https://places.googleapis.com/v1'
GOOGLE_PLACE_IMAGES_LIMIT = 1

# Retrieve image URI for each image ID in restaurant
def get_image(imageId: str):
    image_req_headers = {
        'X-Goog-Api-Key': GOOGLE_API_KEY
    }

    # https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places.photos/getMedia
    url =f'{GOOGLE_PLACES_ENDPOINT}/{imageId}/media'
    params = [
        ('max_width_px', '512')
    ]

    # https://stackoverflow.com/questions/3715493/encoding-an-image-file-with-base64
    # https://github.com/sendpulse/sendpulse-rest-api-python/issues/7
    # https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places.photos/getMedia
    # When retrieving the restaurant image we get an automatic redirect request to the actual image URL.
    # So, this should be intercepted.
    image_response_raw = requests.get(url, params, headers=image_req_headers, allow_redirects=False)
    # https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Location
    # We want to intercept a 3xx response which specifies that the image is located at another URL
    if image_response_raw.status_code // 100 == 3:
        return image_response_raw.headers.get('Location')

def get_nearby_restaurants(latitude: float, longitude: float, limit: int, radius: int) -> Any:
    # https://developers.google.com/maps/documentation/places/web-service/nearby-search?apix_params=%7B%22fields%22%3A%22*%22%2C%22resource%22%3A%7B%22includedTypes%22%3A%5B%22restaurant%22%5D%2C%22maxResultCount%22%3A10%2C%22locationRestriction%22%3A%7B%22circle%22%3A%7B%22center%22%3A%7B%22latitude%22%3A37.7937%2C%22longitude%22%3A-122.3965%7D%2C%22radius%22%3A500%7D%7D%7D%7D
    payload = {
        'includedTypes': [ 'restaurant' ],
        'maxResultCount': limit,
        'locationRestriction': {
            'circle': {
                'center': {
                    'latitude': latitude,
                    'longitude': longitude
                },
                'radius': radius
            }
        }
    }

    # https://stackoverflow.com/questions/8685790/adding-headers-to-requests-module
    headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.googleMapsUri,places.photos'
    }

    google_response = requests.post(f'{GOOGLE_PLACES_ENDPOINT}/places:searchNearby', data=json.dumps(payload), headers=headers)
    #app.logger.warning(google_response.json())
    # Return empty list if no restaurants found
    if 'places' not in google_response.json():
        return jsonify([]), 200

    restaurants_raw = google_response.json()['places']
    restaurants = list(map(lambda restaurant: {
        'restaurantId': restaurant['id'],
        'restaurantTitle': restaurant['displayName']['text'],
        'rating': restaurant['rating'],
        'address': restaurant['formattedAddress'],
        'googleMapsUrl': restaurant['googleMapsUri'],
        'images': list(map(lambda image_obj: get_image(image_obj['name']), restaurant['photos'][:GOOGLE_PLACE_IMAGES_LIMIT]))
    }, restaurants_raw))

    return jsonify(restaurants), 200

def get_restaurant_details(restaurant_id: str) -> Any:
    # https://developers.google.com/maps/documentation/places/web-service/place-details  
    # Price Levels https://googlemaps.github.io/google-maps-services-java/v0.1.17/javadoc/com/google/maps/model/PriceLevel.html

    url = f'{GOOGLE_PLACES_ENDPOINT}/places/{restaurant_id}'
    headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'id,displayName,photos,formattedAddress,location,priceRange,priceLevel,regularOpeningHours,delivery,takeout,dineIn,rating,googleMapsUri'
    }

    google_response = requests.get(url, headers=headers)

    if google_response.status_code != 200:
        return jsonify({'error': 'Restaurant not found'}), 404
    
    restaurant = google_response.json()
    restaurant['images'] = list(map(lambda image_obj: get_image(image_obj['name']), restaurant['photos'][:6]))
    restaurant['displayName'] = restaurant['displayName']['text']

    print("\n\n\nRequesting Google Data")


    return jsonify(restaurant), 200

'''
{
  "formattedAddress": "2011 Bronze Star Dr, Woodland, CA 95776, USA",
  "location": {
    "latitude": 38.670275,
    "longitude": -121.727924
  },
  "rating": 4.6,
  "regularOpeningHours": {
    "openNow": true,
    "periods": [
      {
        "open": {
          "day": 0,
          "hour": 10,
          "minute": 30
        },
        "close": {
          "day": 1,
          "hour": 1,
          "minute": 0
        }
      },
      {
        "open": {
          "day": 1,
          "hour": 10,
          "minute": 30
        },
        "close": {
          "day": 2,
          "hour": 1,
          "minute": 0
        }
      },
      {
        "open": {
          "day": 2,
          "hour": 10,
          "minute": 30
        },
        "close": {
          "day": 3,
          "hour": 1,
          "minute": 0
        }
      },
      {
        "open": {
          "day": 3,
          "hour": 10,
          "minute": 30
        },
        "close": {
          "day": 4,
          "hour": 1,
          "minute": 0
        }
      },
      {
        "open": {
          "day": 4,
          "hour": 10,
          "minute": 30
        },
        "close": {
          "day": 5,
          "hour": 1,
          "minute": 0
        }
      },
      {
        "open": {
          "day": 5,
          "hour": 10,
          "minute": 30
        },
        "close": {
          "day": 6,
          "hour": 1,
          "minute": 30
        }
      },
      {
        "open": {
          "day": 6,
          "hour": 10,
          "minute": 30
        },
        "close": {
          "day": 0,
          "hour": 1,
          "minute": 30
        }
      }
    ],
    "weekdayDescriptions": [
      "Monday: 10:30 AM – 1:00 AM",
      "Tuesday: 10:30 AM – 1:00 AM",
      "Wednesday: 10:30 AM – 1:00 AM",
      "Thursday: 10:30 AM – 1:00 AM",
      "Friday: 10:30 AM – 1:30 AM",
      "Saturday: 10:30 AM – 1:30 AM",
      "Sunday: 10:30 AM – 1:00 AM"
    ],
    "nextCloseTime": "2025-06-11T08:00:00Z"
  },
  "priceLevel": "PRICE_LEVEL_INEXPENSIVE",
  "displayName": {
    "text": "In-N-Out Burger",
    "languageCode": "en"
  },
  "takeout": true,
  "delivery": false,
  "dineIn": true,
  "priceRange": {
    "startPrice": {
      "currencyCode": "USD",
      "units": "1"
    },
    "endPrice": {
      "currencyCode": "USD",
      "units": "10"
    }
  }
}
'''