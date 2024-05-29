#!/bin/bash

# Use Node.js 16
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
nvm use 16

# Set the OpenSSL legacy provider for Node.js 17+
export NODE_OPTIONS=--openssl-legacy-provider

# Launch MongoDB in a new Terminal window. Adjust the path and command as necessary based on your MongoDB installation.
osascript -e 'tell app "Terminal" to do script "startmongo"'
# Alternatively, if using the full command, replace with the correct path to your MongoDB installation.
# osascript -e 'tell app "Terminal" to do script "~/Desktop/MERN/MongoDB/bin/mongod --config ~/Desktop/MERN/MongoDB/mongod.conf"'

# Launch React app for customer-facing in a new Terminal window
osascript -e 'tell app "Terminal" to do script "cd /Users/samblack/Desktop/MERN/Projects/fleetware/dujour-desktop/customerFacing/client && npm start"'

# Start Node.js server for customer-facing in a new Terminal window
osascript -e 'tell app "Terminal" to do script "cd /Users/samblack/Desktop/MERN/Projects/fleetware/dujour-desktop/customerFacing/server && node server.js"'

# Launch React app for admin dashboard in a new Terminal window
osascript -e 'tell app "Terminal" to do script "cd /Users/samblack/Desktop/MERN/Projects/fleetware/dujour-desktop/adminDashboard/client && npm start"'

# Start Node.js server for admin dashboard in a new Terminal window
osascript -e 'tell app "Terminal" to do script "cd /Users/samblack/Desktop/MERN/Projects/fleetware/dujour-desktop/adminDashboard/server && node server.js"'

# Open Mongo Shell in a new Terminal window, assuming MongoDB is installed and added to your PATH
# osascript -e 'tell app "Terminal" to do script "mongo"'
#osascript -e 'tell app "Terminal" to do script "mongo mongodb+srv://sam:RayBan554@dujour.ndt80wa.mongodb.net/test"'
osascript -e 'tell app "Terminal" to do script "mongosh mongodb+srv://sam:RayBan554@dujour.ndt80wa.mongodb.net/test"'



# Open a Terminal window for Git operations, ensuring the path directs to the root of your project
osascript -e 'tell app "Terminal" to do script "cd /Users/samblack/Desktop/MERN/Projects/fleetware/dujour-desktop && git status"'
