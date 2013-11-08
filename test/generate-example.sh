#!/bin/sh

node generate-pseudo-log.js > data/pseudo-access.log.txt

node .. -i data/pseudo-access.log.txt \
        -o ../web/pseudo-data/example-summary.json \
        --header 'mobile-detect UAs'
