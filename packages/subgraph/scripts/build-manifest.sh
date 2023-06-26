#!/bin/bash


if [ -f ../../.env ]
then
  export $(cat ../../.env | sed 's/#.*//g' | xargs)
fi


if [ -z "$SUBGRAPH_NETWORK_NAME" ] 
then
    echo "env is not set, exiting..."
    exit -1
else
    echo "env Network is set to: $SUBGRAPH_NETWORK_NAME"
fi

FILE=$SUBGRAPH_NETWORK_NAME'.json'
DATA=manifest/data/$FILE

PLUGIN_MODULE=$(node -e 'console.log(require("path").dirname(require.resolve("@aragon/todo-osx-plugin-contracts/package.json")))')

echo 'Generating manifest from data file: '$DATA
cat $DATA

mustache \
  $DATA \
  manifest/subgraph.placeholder.yaml \
  | sed -e "s#\$PLUGIN_MODULE#$PLUGIN_MODULE#g" \
  > subgraph.yaml
