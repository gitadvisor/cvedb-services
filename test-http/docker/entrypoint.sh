#!/bin/bash
# Do not exit the container
# - Instead, wait to run tests using `docker exec -it`
# - This enables capturing of Python's debugger and re-running tests
#   without restarting the container

echo "Waiting."
sleep 99999
