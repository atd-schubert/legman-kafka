# Legman-Kafka

Legman for [Kafka](https://kafka.apache.org/) is a simple library build for streaming in strictly object mode with
[Legman](https://github.com/atd-schubert/legman). You can consumer Kafka messages as a stream and write it as objects
into a Legman stream or produce message objects from a Legman stream into Kafka.

## How to use

At first you have to install this module and Legman into your application:

```bash
npm i --save legman legman-kafka
# OR
yarn add legman legman-kafka
```

After that you can import and use Legman in your code.

### Using Legman Kafka as a consumer in typescript

```typescript
import Legman from "legman";
import { LegmanKafkaConsumer } from "legman-kafka";

interface IExampleKafkaPayload {
    action: string;
    id: string;
    // ...
}

const loggerLeg = new Legman({app: "Identifier for my application"});
const kafkaLeg = new LegmanKafkaConsumer(
    ["my_kafka_topic", "another_kafka_topic"],
    {
        noptions: {
            "group.id": "example-consumer",
            "metadata.broker.list": "kafka:9092",
        },
    },
);
kafkaLeg.connect()
    .then(() => console.log("connected to Kafka"))
    .catch((err) => console.error("error while connecting", err));
const processLog = loggerLeg.influx({context: "processing"});

kafkaLeg
    .filter((message: IExampleKafkaPayload) => message.action === "create")
    .on("data", async (message: IExampleKafkaPayload) => {
        const logger = processLog.influx({correlationId: message.id});
        logger.write({msg: "Start processing"});
        await someProcessingFn(message);
        logger.end({msg: "Processing finished"});
    });
```

### Using Legman Kafka as a consumer in JavaScript

```js
const Legman = require("legman");
const { LegmanKafkaConsumer } = require("legman-kafka");

const loggerLeg = new Legman({app: "Identifier for my application"});
const kafkaLeg = new LegmanKafkaConsumer(
    ["my_kafka_topic", "another_kafka_topic"],
    {
        noptions: {
            "group.id": "example-consumer",
            "metadata.broker.list": "kafka:9092",
        },
    },
);
kafkaLeg.connect()
    .then(() => console.log("connected to Kafka"))
    .catch((err) => console.error("error while connecting", err));
const processLog = loggerLeg.influx({context: "processing"});

kafkaLeg
    .filter((message) => message.action === "create")
    .on("data", async (message) => {
        const logger = processLog.influx({correlationId: message.id});
        logger.write({msg: "Start processing"});
        await someProcessingFn(message);
        logger.end({msg: "Processing finished"});
    });
```

### Using Legman Kafka as a producer in TypeScript

```typescript
import Legman from "legman";
import { LegmanKafkaProducer } from "legman-kafka";

interface IExampleKafkaPayload {
    action: string;
    id: string;
    // ...
}

const kafkaProducerLeg = new LegmanKafkaProducer({
    "my_kafka_topic",
    {
        noptions: {
            "client.id": "example-producer",
            "metadata.broker.list": "kafka:9092",
        },
    },
});
const createLeg = new Legman({action: "create"});
const deleteLeg = new Legman({action: "delete"});

createLeg.pipe(kafkaProducerLeg);
deleteLeg.pipe(kafkaProducerLeg);

kafkaProducerLeg.connect()
    .then(() => console.log("connected to Kafka"))
    .catch((err) => console.error("error while connecting", err));
```

### Using Legman Kafka as a producer in JavaScript

```js
const Legman = require("legman");
const { LegmanKafkaProducer } = require("legman-kafka");

const kafkaProducerLeg = new LegmanKafkaProducer({
    "my_kafka_topic",
    {
        noptions: {
            "client.id": "example-producer",
            "metadata.broker.list": "kafka:9092",
        },
    },
});
const createLeg = new Legman({action: "create"});
const deleteLeg = new Legman({action: "delete"});

createLeg.pipe(kafkaProducerLeg);
deleteLeg.pipe(kafkaProducerLeg);

kafkaProducerLeg.connect()
    .then(() => console.log("connected to Kafka"))
    .catch((err) => console.error("error while connecting", err));
```

## Script tasks

* `transpile`: Transpiles the library from TypeScript into JavaScript with type declarations
* `lint`: Lints your code against the recommend TSLint ruleset.
* `test`: Transpiles, lints and runs software-tests with coverage.
* `leakage`: Transpiles, lints and runs software-tests with leakage tests.
* `docker:lint`: Runs the `lint` task in a docker environment.
* `docker:test`: Runs the `test` task in a docker environment.
* `docker:leakage`: Runs the `leakage` task in a docker environment.
* `docker:example`: Runs a simple example in a docker environment.

## License

This module is under [ISC license](LICENSE) copyright 2018 by [Arne Schubert](mailto:atd.schubert@gmail.com)
