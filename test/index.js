"use strict";
require("../lib/legman-kafka.int");

if (process.env.LEAKAGE_TEST) {
    require("../lib/legman-kafka.leakage");
}
