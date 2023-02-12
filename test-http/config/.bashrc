# Testing Aliases
#
# Source this file for useful shell aliases

alias demon='docker exec -it demon'
alias demon-bash='demon /bin/bash'
alias demon-run='\
    docker-compose \
        --file docker/docker-compose.yml \
        up'
alias demon-build='demon-run --build'
alias cve-run='\
    docker-compose \
        --file docker/docker-compose.cve-all.yml \
        up'
alias cve-build='cve-run --build'
alias demon-test='demon pytest -x'
