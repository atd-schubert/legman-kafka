import { KafkaConsumerConfig, KafkaMessage, NConsumer } from "sinek";
import { Readable } from "stream";
import {
    kafkaIdSymbol,
    kafkaKeySymbol,
    kafkaOffsetSymbol,
    kafkaPartitionSymbol,
    kafkaTopicSymbol,
    kafkaVersionSymbol,
} from "./consts";

export class LegmanKafkaConsumer extends Readable {
    public static readonly partitionSymbol = kafkaPartitionSymbol;
    public static readonly keySymbol = kafkaKeySymbol;
    public static readonly idSymbol = kafkaIdSymbol;
    public static readonly offsetSymbol = kafkaOffsetSymbol;
    public static readonly topicSymbol = kafkaTopicSymbol;
    public static readonly versionSymbol = kafkaVersionSymbol;
    private static prepareMessage(originalMessage: KafkaMessage): any {
        return {
            ...originalMessage.value.payload,
            [LegmanKafkaConsumer.partitionSymbol]: originalMessage.partition,
            [LegmanKafkaConsumer.keySymbol]: originalMessage.key.toString(),
            [LegmanKafkaConsumer.idSymbol]: originalMessage.value.id,
            [LegmanKafkaConsumer.offsetSymbol]: originalMessage.offset,
            [LegmanKafkaConsumer.topicSymbol]: originalMessage.topic,
            [LegmanKafkaConsumer.versionSymbol]: originalMessage.value.payload.version,
        };
    }

    protected sinek: NConsumer;
    private waitOnKafka = false;
    private waitOnConsumer = false;
    private lastPackage?: any;
    private lastCallback?: (err: any) => void;

    constructor(
        public readonly topics: string[],
        config: KafkaConsumerConfig,
    ) {
        super({ objectMode: true });
        this.sinek = new NConsumer(this.topics, config);
    }
    public async connect(): Promise<void> {
        await this.sinek.connect();
        this.sinek.consume((originalMessage, callback) => {
            const message = LegmanKafkaConsumer.prepareMessage(originalMessage);
            if (this.waitOnKafka) {
                this.waitOnKafka = false;
                this.push(message);
                return callback(null);
            }
            this.lastPackage = message;
            this.lastCallback = callback;
            this.waitOnConsumer = true;
        }, false, true);
    }
    public async close(commit: boolean = false): Promise<any> {
        return this.sinek.close(commit);
    }

    public _read() {
        if (this.waitOnConsumer) {
            const lastCallback = this.lastCallback!;
            this.push(this.lastPackage);
            this.lastPackage = undefined;
            this.lastCallback = undefined;
            this.waitOnConsumer = false;
            lastCallback(null);
        }
        this.waitOnKafka = true;
    }

}
