"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AxiosHttpClient = void 0;
const axios_1 = __importDefault(require("axios"));
const http_status_codes_1 = require("http-status-codes");
const errors_1 = require("./errors");
class AxiosHttpClient {
    constructor(config = {
        timeout: 2 * 60 * 1000, // 2 minutes
        headers: {
            accept: 'application/json',
            'content-type': 'application/json'
        }
    }) {
        this.fetcher = axios_1.default.create(config);
    }
    handleResponseError(error) {
        const { isAxiosError = false, response } = error;
        if (isAxiosError) {
            throw new errors_1.HttpClientError(`error calling ${response === null || response === void 0 ? void 0 : response.config.url}`, (response === null || response === void 0 ? void 0 : response.data) || {}, (0, http_status_codes_1.getReasonPhrase)((response === null || response === void 0 ? void 0 : response.status) || '') || 'REQUEST_TIMEOUT');
        }
    }
    put(url, data, config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.fetcher.put(url, data, config);
                return { statusCode: result.status, body: result.data };
            }
            catch (error) {
                this.handleResponseError(error);
                throw error;
            }
        });
    }
    patch(url, data, config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.fetcher.patch(url, data, config);
                return { statusCode: result.status, body: result.data };
            }
            catch (error) {
                this.handleResponseError(error);
                throw error;
            }
        });
    }
    delete(url, config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.fetcher.delete(url, config);
                return { statusCode: result.status, body: result.data };
            }
            catch (error) {
                this.handleResponseError(error);
                throw error;
            }
        });
    }
    get(url, config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.fetcher.get(url, config);
                return { statusCode: result.status, body: result.data };
            }
            catch (error) {
                this.handleResponseError(error);
                throw error;
            }
        });
    }
    post(url, data, config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.fetcher.post(url, data, config);
                return { statusCode: result.status, body: result.data };
            }
            catch (error) {
                this.handleResponseError(error);
                throw error;
            }
        });
    }
}
exports.AxiosHttpClient = AxiosHttpClient;
exports.default = new AxiosHttpClient();
