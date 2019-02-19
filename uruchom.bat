start redis\redis-server
start mongodb\mongod --dbpath "mongodb\data" --smallfiles --port 27019
set NODE_ENV=production
start nodejs\node "nodeproj\app.js"
