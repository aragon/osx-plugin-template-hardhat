#!/bin/sh

set -eu

if [ ! -f "./subgraph.yaml" ]; then
  echo "The file subgraph.yaml doesn’t exist. Did you run: yarn build:manifest?"
  exit 1
fi

rm -rf generated
rm -rf build

graph codegen
graph build
