This script get data for car reservation history, converts its to NGSI format and push to context broker.

In docker compose change the orionUri to your context broker url.
orionUri=http://0.0.0.0:1026/

To Build:
docker build -t "profirator/carusoreservationhistory:latest" .

Run Using docker compose:
docker-compose -f docker-compose-dev.yml up -d