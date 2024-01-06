import { StatusCodes } from 'http-status-codes';

export class HttpClientError extends Error {
    constructor(
        public message: string,
        public body?: Record<string, any>,
        public statusCodeAsString?: keyof typeof StatusCodes
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this.constructor);
    }
}
