"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClientError = void 0;
class HttpClientError extends Error {
    constructor(message, body, statusCodeAsString) {
        super(message);
        this.message = message;
        this.body = body;
        this.statusCodeAsString = statusCodeAsString;
        this.name = this.constructor.name;
        Error.captureStackTrace(this.constructor);
    }
}
exports.HttpClientError = HttpClientError;
