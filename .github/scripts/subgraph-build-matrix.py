# !/usr/bin/python

import sys
import os
import json

isTestnet = not sys.argv[1].endswith('/main')
environment = 'production'
if not sys.argv[1].endswith('/main'):
    environment = 'staging'
matrix = {'network': []}

for root,dir,files in os.walk(os.path.join(os.environ['GITHUB_WORKSPACE'], 'packages/subgraph/manifest/data')):
    for file in files:
        if file.endswith('.json') and not file == 'localhost.json':
            matrix['network'].append(file.removesuffix('.json'))

with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
    output.write('environment=' + environment + '\n')
    output.write('matrix=' + json.dumps(matrix) + '\n')