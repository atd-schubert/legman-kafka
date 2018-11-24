import { iterate } from "leakage";
import Legman from "legman";
import { KafkaConsumerConfig, KafkaProducerConfig, LegmanKafkaConsumer, LegmanKafkaProducer } from "./";

const kafkaTopic = "leakage";
const kafkaHost = "kafka:9092";
const kafkaProducerConfig: any = {
    noptions: {
        "batch.num.messages": 1000000,
        "client.id": "example-producer",
        "compression.codec": "snappy",
        "dr_cb": true,
        "event_cb": true,
        "message.send.max.retries": 10,
        "metadata.broker.list": kafkaHost,
        "queue.buffering.max.messages": 100000,
        "queue.buffering.max.ms": 1000,
        "retry.backoff.ms": 200,
        "socket.keepalive.enable": true,
    },
    tconf: {
        "request.required.acks": 1,
    },
};
const kafkaConsumerConfig: KafkaConsumerConfig = {
    noptions: {
        "enable.auto.commit": false,
        "group.id": "example-consumer",
        "metadata.broker.list": kafkaHost,
    },
};

const leakingTestIterations = 10;
const unleakingTestIterations = 100;
const defaultTimeout = 60000; // sorry for that, but leakage tests take a lot of time!
function noop(): void {
    // do nothing...
}
function sleep(ms = 1000): Promise<void> {
    return new Promise((resolve) => void setTimeout(resolve, ms));
}

describe("Legman-Kafka Leakage", () => {
    describe("un-leaky", () => {
        const consumer = new LegmanKafkaConsumer([kafkaTopic], kafkaConsumerConfig);
        const producer = new LegmanKafkaProducer(kafkaTopic, kafkaProducerConfig);

        before("Connect Kafka producer", () => producer.connect());
        before("Connect Kafka consumer", () => consumer.connect());
        after("Close Kafka producer", () => producer.close());
        after("Close Kafka consumer", () => consumer.close());

        it("should not leak while writable is connected and readable is not consumed (back-pressure)", async () => {
            const leg = new Legman();
            leg.pipe(producer);

            return iterate.async(() => {
                for (let i = 0; i < unleakingTestIterations; i += 1) {
                    leg.write({msg: "test"});
                }
                return sleep(1);
            }).then(() => leg.end());
        }).timeout(defaultTimeout);
        it("should not leak while consuming Kafka readable", async () => {
            const out = new Legman();
            const incoming = new Legman();
            incoming.on("data", () => noop);
            out.pipe(producer);
            consumer.pipe(incoming);

            return iterate.async(() => {
                for (let i = 0; i < unleakingTestIterations; i += 1) {
                    out.write({msg: "test"});
                }
                return sleep(1);
            }).then(() => Promise.all([out.end(), consumer.unpipe(incoming), incoming.end()]));
        }).timeout(defaultTimeout);
    });
    describe("leaky", () => {
        it("should leak while writable is not connected (buffer)", async () => {
            const noError = new Error("No error was emitted");
            const conf: KafkaProducerConfig = {...kafkaProducerConfig};
            conf.noptions!["metadata.broker.list"] = "unreachable1:9092,unreachable2:9092,unreachable3:9092";
            const producer = new LegmanKafkaProducer(kafkaTopic, conf, 1);
            producer.connect();
            const leg = new Legman();
            leg.pipe(producer);

            return iterate.async(() => {
                for (let i = 0; i < leakingTestIterations; i += 1) {
                    leg.write({msg: "test"});
                }
                return sleep(1);
            })
                .then(() => {
                    throw noError;
                })
                .catch((err) => { if (err === noError) { producer.close(); throw noError; }})
                .then(() => producer.close());
        }).timeout(defaultTimeout);
    });

});
