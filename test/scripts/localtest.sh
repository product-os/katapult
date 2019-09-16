#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
COMPOSE_FILE="${DIR}/../docker-compose.test.yml"

function finish {
  echo "Cleaning up..."
  docker rm -f katapult-kube || true
  docker-compose -f "$COMPOSE_FILE" down -v
}
trap finish EXIT

docker run -d --name katapult-kube --privileged -p 8443:8443 -p 10080:10080 bsycorp/kind:latest-1.12
docker-compose -f "$COMPOSE_FILE" build

until curl -s --fail http://127.0.0.1:10080/config; do
  sleep 1;
done
echo "Kubernetes ready - start test stack!"

export KATAPULT_KUBE_CONFIG="$(curl --silent http://localhost:10080/config 2>&1)"
docker-compose -f "$COMPOSE_FILE" up -d
echo "Test stack ready - run tests!"

docker-compose -f "$COMPOSE_FILE" exec tests npm run test
