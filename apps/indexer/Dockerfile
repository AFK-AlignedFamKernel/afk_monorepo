# Notice that the base image is build from scratch (not an OS like Ubuntu),
# so the binary is in a location that depends on the build.
# For this reason we stick to a specific version and architecture.
#
# When updating the image you also need to update the entrypoint below.
#
# - docker image pull quay.io/apibara/sink-postgres:0.7.0-x86_64
# - docker image inspect quay.io/apibara/sink-postgres:0.7.0-x86_64 | jq '.[].Config.Entrypoint'
FROM quay.io/apibara/sink-postgres:0.7.0-x86_64

WORKDIR /app
COPY ./src/* /app

ARG POSTGRES_CONNECTION_STRING

ENV POSTGRES_CONNECTION_STRING=${POSTGRES_CONNECTION_STRING}

ARG PGAPPNAME

ENV PGAPPNAME=${PGAPPNAME}

ARG PGDATABASE

ENV PGDATABASE=${PGDATABASE}

ARG PGHOST

ENV PGHOST=${PGHOST}

ARG PGPASSWORD

ENV PGPASSWORD=${PGPASSWORD}

ARG PGPORT

ENV PGPORT=${PGPORT}

ARG PGUSER

ENV PGUSER=${PGUSER}

ENTRYPOINT ["/nix/store/rh1g8pb7wfnyr527jfmkkc5lm3sa1f0l-apibara-sink-postgres-0.7.0/bin/apibara-sink-postgres"]
