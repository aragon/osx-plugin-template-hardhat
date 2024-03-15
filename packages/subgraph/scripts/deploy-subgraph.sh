#!/usr/bin/env bash

if [ -f ../../.env ]
then
  export $(cat ../../.env | sed 's/#.*//g' | xargs)
fi

if [ -z "$SUBGRAPH_NETWORK_NAME" ] || [ -z "$SUBGRAPH_NAME" ] || [ -z "$GRAPH_KEY" ] || [ -z "$SUBGRAPH_VERSION" ]
then
    echo "env variables are not set properly, exiting..."
    exit -1
fi

# Exit script as soon as a command fails.
set -o errexit

# Build manifest
echo ''
echo '> Building manifest file subgraph.yaml'
./scripts/build-manifest.sh

# Build subgraph
echo ''
echo '> Building subgraph'
./scripts/build-subgraph.sh

if [ "$SUBGRAPH_NETWORK_NAME" == 'localhost' ]
then
  SUBGRAPH_NETWORK_NAME='goerli'
fi

# Prepare subgraph name
FULLNAME=$SUBGRAPH_NAME-$SUBGRAPH_NETWORK_NAME
if [ "$STAGING" ]; then
  FULLNAME=$FULLNAME-staging
fi
echo ''
echo '> Deploying subgraph: '$FULLNAME
echo '> Subgraph version: '$SUBGRAPH_VERSION

# check if the repo address is null or zero address
FILE=manifest/data/$SUBGRAPH_NETWORK_NAME'.json'

address=$(jq -r '.dataSources.Plugin.address' "$FILE")

if [ "$address" = "null" ] || [ "$address" = "0x0000000000000000000000000000000000000000" ];
  then
    echo "Repo address is not set properly, exiting..."
    exit -1
fi

# Deploy subgraph
if [ "$LOCAL" ]
then
    graph deploy $FULLNAME \
        --ipfs http://localhost:5001 \
        --node http://localhost:8020
else
    graph deploy $FULLNAME \
        --version-label $SUBGRAPH_VERSION \
        --node https://subgraphs.alchemy.com/api/subgraphs/deploy \
        --deploy-key $GRAPH_KEY > deploy-output.txt

    SUBGRAPH_ID=$(grep "Build completed:" deploy-output.txt | grep -oE "Qm[a-zA-Z0-9]{44}")
    rm deploy-output.txt
    echo "The Graph deployment complete: ${SUBGRAPH_ID}"

fi