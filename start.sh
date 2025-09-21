#!/bin/sh

# Start the backend API server
cd /usr/app/backend
npm start &

# Start nginx
nginx -g "daemon off;"