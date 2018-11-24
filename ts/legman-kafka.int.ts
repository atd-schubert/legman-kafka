import { expect } from "chai";
import { Readable, Writable } from "stream";
import { KafkaConsumerConfig, LegmanKafkaConsumer, LegmanKafkaProducer } from "./";

const kafkaTopic = "test";
const kafkaHost = "kafka:9092";
const kafkaProducerConfig: any = {
    noptions: {
        "batch.num.messages": 1000000,
        "client.id": "test-producer",
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
    tconf: { "auto.offset.reset": "end" }, // omit previous messages
};
function noop(): void {
    // do nothing...
}

describe("Legman-Kafka", () => {
    describe("instantiation consumer", () => {
        it("should be instantiatable", () => expect(
            new LegmanKafkaConsumer([kafkaTopic], kafkaConsumerConfig)).instanceOf(LegmanKafkaConsumer),
        );
        it("should be an instance of a Writable Stream", () => expect(
            new LegmanKafkaConsumer([kafkaTopic], kafkaConsumerConfig)).instanceOf(Readable),
        );
    });
    describe("instantiation producer", () => {
        it("should be instantiatable", () => expect(
            new LegmanKafkaProducer(kafkaTopic, kafkaProducerConfig)).instanceOf(LegmanKafkaProducer),
        );
        it("should be an instance of a Writable Stream", () => expect(
            new LegmanKafkaProducer(kafkaTopic, kafkaProducerConfig)).instanceOf(Writable),
        );
    });
    describe("send and receive message", () => {

        const consumer = new LegmanKafkaConsumer([kafkaTopic], kafkaConsumerConfig);
        const producer = new LegmanKafkaProducer(kafkaTopic, kafkaProducerConfig);

        before("Connect Kafka producer", () => producer.connect());
        before("Connect Kafka consumer", () => consumer.connect());
        // Otherwise we can get problems with messages while listening with `once`.
        before("Consume Kafka consumer", () => consumer.on("data", noop));
        after("Close Kafka producer", () => producer.close());
        after("Close Kafka consumer", () => consumer.close());

        it("should send messages", () => producer.write({msg: "Just send this message..."}));

        it("should send and receive a message", (done: Mocha.Done) => {
            const testMessage = {msg: "This is a test message for streaming through Kafka"};

            consumer.once("data", (message: any) => {
                expect(message).has.property("id");
                expect(message).has.property("version");
                expect(message[LegmanKafkaConsumer.partitionSymbol]).to.be.a("number");
                expect(message[LegmanKafkaConsumer.keySymbol]).to.be.a("string");
                expect(message[LegmanKafkaConsumer.idSymbol]).to.be.a("string");
                expect(message[LegmanKafkaConsumer.offsetSymbol]).to.be.a("number");
                expect(message[LegmanKafkaConsumer.topicSymbol]).equal(kafkaTopic);
                expect(message.msg).equal(testMessage.msg);
                done();
            });
            producer.write(testMessage);
        });
        it("should send and receive a message on a specific partition", (done: Mocha.Done) => {
            const partition = 11;
            const testMessage = {
                msg: "This is a test message for streaming through Kafka",
                [LegmanKafkaProducer.partitionSymbol]: partition,
            };

            consumer.once("data", (message: any) => {
                expect(message[LegmanKafkaConsumer.partitionSymbol]).equal(partition);
                done();
            });
            producer.write(testMessage);
        });
        it("should send and receive a message with a specific version", (done: Mocha.Done) => {
            const version = 11;
            const testMessage = {
                msg: "This is a test message for streaming through Kafka",
                [LegmanKafkaProducer.versionSymbol]: version,
            };

            consumer.once("data", (message: any) => {
                expect(message[LegmanKafkaConsumer.versionSymbol]).equal(version);
                done();
            });
            producer.write(testMessage);
        });
        it("should send and receive a message with a specific key", (done: Mocha.Done) => {
            const key = "siebenundfürzigelf";
            const testMessage = {
                msg: "This is a test message for streaming through Kafka",
                [LegmanKafkaProducer.keySymbol]: key,
            };

            consumer.once("data", (message: any) => {
                expect(message[LegmanKafkaConsumer.keySymbol]).equal(key);
                done();
            });
            producer.write(testMessage);
        });
        it("should send and receive a message with a id and version properties deep equal", (done: Mocha.Done) => {
            const testMessage = {
                id: "siebenundfürzigelf",
                msg: "This is a test message for streaming through Kafka",
                version: 11,
            };

            consumer.once("data", (message: any) => {
                expect(message).deep.equal(testMessage);
                done();
            });
            producer.write(testMessage);
        });
    });
});
