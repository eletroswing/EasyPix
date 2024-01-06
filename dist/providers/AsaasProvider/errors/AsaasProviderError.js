"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsaasProviderError = void 0;
const interfaces_1 = require("../../../shared/interfaces");
class AsaasProviderError extends Error {
    constructor(message = `Unexpected error executing operation in [${interfaces_1.PROVIDERS.ASAAS} provider`) {
        super(message);
        this.provider = interfaces_1.PROVIDERS.ASAAS;
        this.name = this.constructor.name;
        Error.captureStackTrace(this.constructor);
    }
}
exports.AsaasProviderError = AsaasProviderError;
