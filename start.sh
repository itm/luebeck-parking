#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
forever start -a $DIR/forever.log -o $DIR/out.log -e $DIR/err.log $DIR/luebeck-parking-server.js
