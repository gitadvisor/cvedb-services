# Using Docker with CVE Services

## Security Considerations

>**Warning**
>
>DO NOT use the included Docker compose configuration on a public network. The environment and docker-compose.yml files contain CVE Services credentials and do not enforce MongoDB authentication. This enables rapid, local-only development and is not secure for public deployment.

## Local Development and Testing

The following builds and runs cve-services (Node.js app and Mongo) in Docker containers. The included example configurations run the services in `dev` or `int` mode.

>**Note**
>
> These commands must be run from the `docker/` directory.

### Environments

See the `.docker-env.example` and `.docker-env.int-example` files for examples of required environment variables. For development environments, it's important to define the following:

```
LOCAL_KEY=XXXXXXX-XXXXXXX-XXXXXXX-XXXXXXX
NODE_ENV=development
```

When using a development environment, the `LOCAL_KEY` is the API token key for the secretariat. In integration environments, the API keys will be written to a file named `user-secret.txt` in the project directory after database population.

### Start Docker Containers

```bash
cd docker/
git switch <branchname>

# use the integration environment
cp .docker-env.int-example .docker-env
docker compose up --build
```

>**Note**
>
> Use branch name `int` for penetration testing, and `dev` for local development.

Docker will build or update the containers if needed. In a few minutes, you should see something similar to the following:

```
[+] Running 3/3
 ⠿ Network docker_cve-services  Created
 ⠿ Container mongo              Created
 ⠿ Container cveawg             Created
Attaching to cveawg, mongo
mongo   | 2022-06-07T19:29:07.594+0000 I CONTROL  [initandlisten] MongoDB starting : pid=1 port=27017 dbpath=/data/db 64-bit host=551bb45dbadc
...
mongo   | 2022-06-07T19:29:08.106+0000 I NETWORK  [initandlisten] listening via socket bound to 0.0.0.0
mongo   | 2022-06-07T19:29:08.106+0000 I NETWORK  [initandlisten] listening via socket bound to /tmp/mongodb-27017.sock
mongo   | 2022-06-07T19:29:08.106+0000 I NETWORK  [initandlisten] waiting for connections on port 27017
...
cveawg  | > cve-services@0.0.3 start:dev /app
cveawg  | > node src/swagger.js && NODE_ENV=development node src/scripts/updateOpenapiHost.js && NODE_ENV=development node-dev src/index.js
...
cveawg  | 2022-06-07 19:29:10 [info]: "Using NODE_ENV 'development' and app environment 'development'"
cveawg  | 2022-06-07 19:29:11 [info]: "Using dbName = cve_dev"
...
cveawg  | 2022-06-07 19:29:11 [info]: "Successfully connected to database!"
cveawg  | 2022-06-07 19:29:11 [info]: "Serving on port 3000"
```

#### The Docker CVE_PREFLIGHT argument

The Docker build process fetches resources on the public internet. Some corporate environments require specific configuration to enable communication with public networks (e.g., corporate proxies or custom CA certificates). The included Dockerfiles expose an optional build argument, `CVE_PREFLIGHT`, that allows a script to run before any network traffic is attempted. For example, to fetch and run a script that installs corporate CA certificates:

```
docker compose build --no-cache --build-arg CVE_PREFLIGHT="wget -q -O - --no-check-certificate https://pki.intranet/install_certs.sh | sh"
```

If you do not require special configuration to access the internet, you can safely omit the build argument.

### Pre-load Data

Populate mongoDB with test data included in `datadump/pre-population/`

Run the command below using `populate:dev` or `populate:int` depending on your environment:
```
docker-compose exec cveawg npm run populate:int
```

You should see the following:
```
> cve-services@0.0.3 populate:dev /app
> NODE_ENV=development node-dev src/scripts/populate.js

2022-06-07 19:58:32 [info]: "Using NODE_ENV 'development' and app environment 'development'"
2022-06-07 19:58:32 [info]: "Using dbName = cve_dev"
2022-06-07 19:58:32 [info]: "Will try to connect to database cve_dev at docdb:27017"
2022-06-07 19:58:32 [info]: "Successfully connected to database!"
Are you sure you wish to pre-populate the database for the development environment? Doing so will drop the Cve, Cve-Id-Range, Cve-Id, User, Org collection(s) in the cve_dev database. (y/n) y

2022-06-07 19:58:37 [info]: "Populating Org collection..."
2022-06-07 19:58:37 [info]: "Org populated!"
2022-06-07 19:58:37 [info]: "Populating User collection..."
2022-06-07 19:58:38 [info]: "User populated!"
2022-06-07 19:58:38 [info]: "Populating Cve-Id-Range collection..."
2022-06-07 19:58:38 [info]: "Populating Cve collection..."
2022-06-07 19:58:38 [info]: "Populating Cve-Id collection..."
2022-06-07 19:58:38 [info]: "Cve-Id-Range populated!"
2022-06-07 19:58:38 [info]: "Cve populated!"
2022-06-07 19:58:39 [info]: "Cve-Id populated!"
2022-06-07 19:58:39 [info]: "Successfully populated the database!"

```

### Display the API key

The API token key is generated or stored differently depending on the value of the `NODE_ENV` environment variable.

#### Integration

For `integration` Node environments, the API key will be generate and saved to the `user-secret.txt` file when the database is populated.

Display the key with:

`docker-compose exec cveawg grep admin2 user-secret.txt`

#### Development

In `development` environments, the API is the value of the `LOCAL_KEY` variable in the `.docker-env` file.

You can view the value for the running container with:

`docker-compose exec cveawg env | grep LOCAL_KEY`

### Use Curl to Test

#### Create a curl config file (recommended)

Securely create a curl config file in `$HOME/.curl-cve-config` similar to the following, where each line is a curl argument. In dev environments, use the value of the `LOCAL_KEY` environment variable (also output when pre-populating) as the API key.

>**Warning**
>
>To ensure security of the credentials, create an empty file and restrict its permissions before saving the API key:
>
>`touch $HOME/.curl-cve-config && chmod 600 $HOME/.curl-cve-config && vi $HOME/.curl-cve-config`

```
-H "CVE-API-ORG: mitre"
-H "CVE-API-USER: admin2@mitre.org"
-H "CVE-API-KEY: XXXXXXX-XXXXXXX-XXXXXXX-XXXXXXX"
-H "Content-type: application/json"
-s
-S
```

#### Use curl to test the API endpoints

See the [API documentation](https://github.com/CVEProject/cve-services#api-documentation) for available endpoints.

  * Show CVE IDs:
  `curl -K ~/.curl-cve-config http://localhost:3000/api/cve-id`

  * Retrieve organization info (Secretariat only. Use appropriate credentials in curl config file):
  `curl -K ~/.curl-cve-config http://localhost:3000/api/org`

  * Add a CNA (Secretariat only. Use appropriate credentials in curl config file):
    `curl -K ~/.curl-cve-config -X POST \
      --data-binary '{"name": "Example Corporation","short_name": "exampleCorp"}' \
      http://localhost:3000/api/org`


>**Note**
>
>Each command returns unformatted JSON. Piping through a formatter like [JQ](https://stedolan.github.io/jq/) makes it easier to read: `curl -K ~/.curl-cve-config http://localhost:3000/api/cve-id | jq .`

## To shell into the web app server

  `docker compose exec cveawg /bin/sh`

## Mongo DB

The `docker-compose.yml` file exposes the default Mongo port to the host: `localhost:27017`. You can connect using any Mongo viewer such as [Mongo Express](https://github.com/mongo-express/mongo-express) or [Compass](https://www.mongodb.com/try/download/compass) on the host.

## Running unit tests

You can run unit tests using the docker image by running the following command:

`docker exec -it cveawg npm run test`
