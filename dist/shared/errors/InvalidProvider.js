"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidProvider = void 0;
class InvalidProvider extends Error {
    constructor(provider) {
        super(`The provider provided is invalid or not implemented yet - [${provider}]`);
        this.name = this.constructor.name;
        Error.captureStackTrace(this.constructor);
    }
}
exports.InvalidProvider = InvalidProvider;
