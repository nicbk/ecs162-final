
## To run the Foodie website please get the follow done
- The google api key and put it in your .env file
- The firebase api key from firebase
- Add the port number
- Set the mongoDB
- Run the docker using the run-dev.sh script

## Running the unit tests

We went with playwright and vitest browser in writing our unit tests so that we
could simultaneously test both frontend/backend. To run the tests, an .env file
is needed within the frontend directory that mimics the .env file within the
project.

First, launch the docker container in dev mode with
`docker compose -f docker-compose.dev.yml up --build`

Then, attach a shell to the frontend docker container with
`docker exec -it ecs162-final-frontend-1 /bin/bash`

Finally, run this in the frontend container shell:
`npm run test:browser:coverage`