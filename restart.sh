#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
forever stop $DIR/luebeck-parking-server.js
forever start -a $DIR/forever.log -o $DIR/out.log -e $DIR/err.log $DIR/luebeck-parking-server.js
