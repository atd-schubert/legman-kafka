import Legman from "legman";
import { LegmanKafkaConsumer, LegmanKafkaProducer } from "../lib";

const kafkaTopic = "example";
const kafkaHost = "kafka:9092";

const consumer = new LegmanKafkaConsumer([kafkaTopic], {
    noptions: {
        "enable.auto.commit": false,
        "group.id": "example-consumer",
        "metadata.broker.list": kafkaHost,
    },
    tconf: { "auto.offset.reset": "end" }, // omit previous messages
});
const producer = new LegmanKafkaProducer(kafkaTopic, {
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
} as any);

consumer.on("data", (message) => {
    if (message.msg === "ping") {
        // tslint:disable-next-line:no-console
        console.log("Got ping send pong");
        producer.write({msg: "pong"});
        return;
    }
    if (message.msg === "pong") {
        // tslint:disable-next-line:no-console
        console.log("Got pong send ping");
        producer.write({msg: "ping"});
        return;
    }
});

Promise.all([consumer.connect(), producer.connect()]).then(() => {
    // tslint:disable-next-line:no-console
    console.log("Sending inital ping");
    producer.write({msg: "ping"});
});
