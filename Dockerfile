FROM node:latest as builder

MAINTAINER Arne Schubert <atd.schubert@gmail.com>

WORKDIR /opt/legman-kafka
RUN set -x \
  && apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y \
       librdkafka1 \
       build-essential python librdkafka-dev libsasl2-dev libsasl2-modules openssl


# Make dependencies cacheable
COPY ./package-lock.json ./package.json /opt/legman-kafka/
RUN npm i

COPY . /opt/legman-kafka
RUN npm run transpile

FROM node:latest

RUN set -x \
  && apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y \
       librdkafka1 \
  && apt-get autoremove -y && apt-get autoclean -y \
  && rm -rf /var/lib/apt/lists/*


COPY --from=builder /opt/legman-kafka /opt/legman-kafka
WORKDIR /opt/legman-kafka
CMD ["npm", "test"]
