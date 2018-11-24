import { KafkaProducerConfig, NProducer } from "sinek";
import { Writable } from "stream";
import {
    kafkaKeySymbol,
    kafkaPartitionSymbol,
    kafkaVersionSymbol,
} from "./consts";

export class LegmanKafkaProducer extends Writable {
    public static readonly partitionSymbol = kafkaPartitionSymbol;
    public static readonly keySymbol = kafkaKeySymbol;
    public static readonly versionSymbol = kafkaVersionSymbol;

    protected sinek: NProducer;
    constructor(
        public readonly topic: string,
        config: KafkaProducerConfig,
        defaultPartitionCount: number | "auto" = "auto",
    ) {
        super({ objectMode: true });
        this.sinek = new NProducer(config, null, defaultPartitionCount);
    }
    public connect(): Promise<void> {
        return this.sinek.connect();
    }
    public async close(commit: boolean = false): Promise<any> {
        return this.sinek.close(commit);
    }

    public _write(chunk: any, encoding: string, callback: (error?: Error | null) => void): void {
        process.nextTick(() => {
            this.sinek.bufferFormatPublish(
                this.topic,
                chunk[LegmanKafkaProducer.keySymbol] ? chunk[LegmanKafkaProducer.keySymbol] : undefined,
                {...chunk},
                chunk[LegmanKafkaProducer.versionSymbol] ? chunk[LegmanKafkaProducer.versionSymbol] : undefined,
                null,
                typeof chunk.partitionKey === "string" ? chunk.partitionKey : undefined,
                chunk[LegmanKafkaProducer.partitionSymbol] ? chunk[LegmanKafkaProducer.partitionSymbol] : undefined,
            )
                .then(() => callback())
                .catch((err) => callback(err));
        });
    }
}
