import { PROVIDERS } from "../interfaces";

export class MissingApiKey extends Error {
    constructor(message = 'Missing api key', public readonly provider = PROVIDERS.ASAAS) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this.constructor);
    }
}