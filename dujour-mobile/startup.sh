#!/bin/bash

# Use Node.js 16
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
nvm use 16

# Set the OpenSSL legacy provider for Node.js 17+
export NODE_OPTIONS=--openssl-legacy-provider
source ../dujour-shared/config.sh
# Assuming the .env file is in the server directory and formatted with exports

# Launch MongoDB in a new Terminal window. Adjust the path and command as necessary based on your MongoDB installation.
osascript -e 'tell app "Terminal" to do script "startmongo"'
# Alternatively, if using the full command, replace with the correct path to your MongoDB installation.
# osascript -e 'tell app "Terminal" to do script "~/Desktop/MERN/MongoDB/bin/mongod --config ~/Desktop/MERN/MongoDB/mongod.conf"'

# Launch React app in a new Terminal window, ensure the path matches where your React app is located.
osascript -e 'tell app "Terminal" to do script "cd /Users/samblack/Desktop/MERN/Projects/fleetware/dujour-mobile/client && npm start"'

# Start Node.js server in a new Terminal window, ensuring the path is correct for where your server code resides.
osascript -e 'tell app "Terminal" to do script "cd /Users/samblack/Desktop/MERN/Projects/fleetware/dujour-mobile/server && node server.js"'

# Open Mongo Shell in a new Terminal window, assuming MongoDB is installed and added to your PATH
# osascript -e 'tell app "Terminal" to do script "mongo"'
osascript -e 'tell app "Terminal" to do script "mongosh mongodb+srv://'$mongoUserName':'$mongoPwd'@'$mongoClusterName'.mongodb.net/Dujour"'

# Open a Terminal window for Git operations, ensuring the path directs to the root of your project.
osascript -e 'tell app "Terminal" to do script "cd /Users/samblack/Desktop/MERN/Projects/fleetware && git status"'
