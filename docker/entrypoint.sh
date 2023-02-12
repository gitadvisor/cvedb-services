#!/bin/sh
echo "> NODE_ENV=$NODE_ENV"
echo "> MONGO_HOST=$MONGO_HOST"
echo "> MONGO_PORT=$MONGO_PORT"

# run the application based on node environment
if [[ "$NODE_ENV" == "development" ]]; then
    npm run start:dev
elif [[ "$NODE_ENV" == "staging" ]]; then
    npm run start:stage    
elif [[ "$NODE_ENV" == "integration" ]]; then
    npm run start:int
elif [[ "$NODE_ENV" == "prod-staging" ]]; then
    npm run start:prdstg
elif [[ "$NODE_ENV" == "production" ]]; then
    npm run start:prd
else
    echo "Your NODE_ENV, $NODE_ENV, specified in entrypoint.sh does not correspond with an application environment."
    exit 1
fi
