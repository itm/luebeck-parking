#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
forever stop $DIR/luebeck-parking-server.js
