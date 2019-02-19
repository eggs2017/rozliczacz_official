#!/bin/bash
mongod --dbpath "mongodb/data" --smallfiles --port 27019 & redis-server --port 6370 & nodejs nodeproj/app.js
