export class InvalidProvider extends Error {
    constructor(provider: string) {
        super(`The provider provided is invalid or not implemented yet - [${provider}]`);
        this.name = this.constructor.name;
        Error.captureStackTrace(this.constructor);
    }
}