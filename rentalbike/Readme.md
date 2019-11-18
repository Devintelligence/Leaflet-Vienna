This script get data for rental bike, converts its to NGSI format and push to context broker.

In script change this line to your context broker url.
orionUri = "http://0.0.0.0:1026/v2/entities"

To Build:
docker build -t "rentalbike:latest" .

Run Using docker compose:
docker-compose -f docker-compose-dev.yml up -d