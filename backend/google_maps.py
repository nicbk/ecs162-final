import os
from typing import Any
import requests
import json
import base64
from flask import jsonify

GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
GOOGLE_PLACES_ENDPOINT = 'https://places.googleapis.com/v1'
GOOGLE_PLACE_IMAGES_LIMIT = 1

def get_nearby_restaurants(app: Any, latitude: float, longitude: float, limit: int, radius: int):
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
      image_response_raw = requests.get(url, params, headers=image_req_headers)
      encodedImage = base64.b64encode(image_response_raw.text.encode('utf-8')).decode('utf-8')
      return encodedImage

  google_response = requests.post(f'{GOOGLE_PLACES_ENDPOINT}/places:searchNearby', data=json.dumps(payload), headers=headers)
  app.logger.warning(google_response.json())
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