#!/bin/bash
DROPLET_ONE_NAME="one"

echo "* Removing $DROPLET_ONE_NAME..."
docker-machine rm -y $DROPLET_ONE_NAME
