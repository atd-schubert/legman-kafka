"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const lib_1 = __importDefault(require("../lib")); // from "legman"
const baseLeg = new lib_1.default({ app: "com.atd-schubert.legman-test" });
const httpLeg = baseLeg.influx({ context: "http" });
const httpRequestLeg = httpLeg.influx({ type: "request" });
const httpResponseLeg = httpLeg.influx({ type: "response" });
const filterMessagesLeg = baseLeg.filter((message) => message.hasOwnProperty("msg"));
const trimmedLeg = filterMessagesLeg.map((message) => {
    const trimmed = Object.assign({}, message);
    delete trimmed.app;
    return trimmed;
});
trimmedLeg.on("data", (obj) => {
    const objCopy = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            objCopy[key] = obj[key];
        }
    }
    // tslint:disable-next-line:no-console
    console.log(objCopy);
});
const requestSymbol = Symbol("Legman HTTP request");
const responseSymbol = Symbol("Legman HTTP response");
const server = http_1.createServer((request, response) => httpRequestLeg.write({
    [requestSymbol]: request,
    [responseSymbol]: response,
    correlationId: request.headers.correlationid || Math.random(),
    method: request.method,
    msg: "Incoming request",
    path: request.url,
}));
const adminLeg = httpRequestLeg.filter((message) => /\/admin/.test(message[requestSymbol].url));
adminLeg.on("data", (message) => {
    message[responseSymbol].writeHead(200, { "content-type": "text/plain" });
    message[responseSymbol].end("it works");
});
server.listen(8080, () => httpLeg.write({ msg: "Listening", port: 8080 }));
