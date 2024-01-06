"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingApiKey = void 0;
const interfaces_1 = require("../interfaces");
class MissingApiKey extends Error {
    constructor(message = 'Missing api key', provider = interfaces_1.PROVIDERS.ASAAS) {
        super(message);
        this.provider = provider;
        this.name = this.constructor.name;
        Error.captureStackTrace(this.constructor);
    }
}
exports.MissingApiKey = MissingApiKey;
