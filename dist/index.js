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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _EasyPix_instances, _EasyPix_API_KEY, _EasyPix_configPath, _EasyPix_mainLoop, _EasyPix_loopSecondsDelay, _EasyPix_ApiInterface, _EasyPix_dueFunction, _EasyPix_paidFunction, _EasyPix_provider, _EasyPix_init, _EasyPix_loop, _EasyPix_overdue;
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_schedule_1 = __importDefault(require("node-schedule"));
const interfaces_1 = require("./shared/interfaces");
const providers_1 = require("./providers");
const errors_1 = require("./shared/errors");
class EasyPix {
    constructor({ apiKey = null, useSandbox = true, loopSecondsDelay = 60, provider = interfaces_1.PROVIDERS.ASAAS, configPath = "./" }) {
        _EasyPix_instances.add(this);
        _EasyPix_API_KEY.set(this, void 0);
        _EasyPix_configPath.set(this, void 0);
        _EasyPix_mainLoop.set(this, void 0);
        _EasyPix_loopSecondsDelay.set(this, void 0);
        _EasyPix_ApiInterface.set(this, void 0);
        _EasyPix_dueFunction.set(this, void 0);
        _EasyPix_paidFunction.set(this, void 0);
        _EasyPix_provider.set(this, void 0);
        __classPrivateFieldSet(this, _EasyPix_provider, provider, "f");
        __classPrivateFieldSet(this, _EasyPix_API_KEY, apiKey || '', "f");
        const providers = {
            [interfaces_1.PROVIDERS.ASAAS]: providers_1.AsaasProvider
        };
        if (!providers[provider]) {
            throw new errors_1.InvalidProvider(provider);
        }
        __classPrivateFieldSet(this, _EasyPix_ApiInterface, new providers[provider]({ API_KEY: apiKey, useSandbox }), "f");
        __classPrivateFieldSet(this, _EasyPix_configPath, configPath, "f");
        __classPrivateFieldSet(this, _EasyPix_loopSecondsDelay, loopSecondsDelay, "f");
        __classPrivateFieldSet(this, _EasyPix_mainLoop, undefined, "f");
        __classPrivateFieldSet(this, _EasyPix_dueFunction, () => { }, "f");
        __classPrivateFieldSet(this, _EasyPix_paidFunction, () => { }, "f");
        this.pendingPayments = [];
        __classPrivateFieldGet(this, _EasyPix_instances, "m", _EasyPix_init).call(this);
    }
    get apiKey() {
        return __classPrivateFieldGet(this, _EasyPix_API_KEY, "f");
    }
    get configPath() {
        return __classPrivateFieldGet(this, _EasyPix_configPath, "f");
    }
    get loopSecondsDelay() {
        return __classPrivateFieldGet(this, _EasyPix_loopSecondsDelay, "f");
    }
    get provider() {
        return __classPrivateFieldGet(this, _EasyPix_provider, "f");
    }
    get step() {
        return __classPrivateFieldGet(this, _EasyPix_instances, "m", _EasyPix_loop);
    }
    get overdue() {
        return __classPrivateFieldGet(this, _EasyPix_instances, "m", _EasyPix_overdue);
    }
    get dueFunction() {
        return __classPrivateFieldGet(this, _EasyPix_dueFunction, "f");
    }
    get paydFunction() {
        return __classPrivateFieldGet(this, _EasyPix_paidFunction, "f");
    }
    get apiInterface() {
        return __classPrivateFieldGet(this, _EasyPix_ApiInterface, "f");
    }
    onDue(cb) {
        __classPrivateFieldSet(this, _EasyPix_dueFunction, cb, "f");
    }
    onPaid(cb) {
        __classPrivateFieldSet(this, _EasyPix_paidFunction, cb, "f");
    }
    create({ id, name, taxId, value, description, metadata = {}, expiresIn = 5 * 60, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const pix = yield __classPrivateFieldGet(this, _EasyPix_ApiInterface, "f").createPixPayment({
                id,
                name,
                value,
                taxId,
                description,
            });
            if (expiresIn < 60 || expiresIn > 60 * 60 * 48) {
                throw new Error(`Expires in must be in the range 60 seconds to 48 hours`);
            }
            const now = new Date();
            const expirationDate = new Date(now.getTime() + expiresIn * 1000);
            this.pendingPayments.push({
                id,
                metadata,
                value: pix.value,
                netValue: pix.netValue,
                originalId: pix.originalId,
                expirationDate,
            });
            node_fs_1.default.writeFileSync(node_path_1.default.join(__classPrivateFieldGet(this, _EasyPix_configPath, "f"), "config.json"), JSON.stringify(this.pendingPayments));
            const callJobDate = new Date(expirationDate);
            node_schedule_1.default.scheduleJob(id, callJobDate, __classPrivateFieldGet(this, _EasyPix_instances, "m", _EasyPix_overdue).call(this, id, pix.originalId));
            return Object.assign(Object.assign({}, pix), { expirationDate });
        });
    }
    deleteCob(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const deletingCurrent = this.pendingPayments.find((item) => item.id === id);
            this.pendingPayments = this.pendingPayments.filter((item) => item.id !== id);
            node_fs_1.default.writeFileSync(node_path_1.default.join(__classPrivateFieldGet(this, _EasyPix_configPath, "f"), "config.json"), JSON.stringify(this.pendingPayments));
            node_schedule_1.default.cancelJob(id);
            yield __classPrivateFieldGet(this, _EasyPix_ApiInterface, "f").deletePixChargeByPaymentId(deletingCurrent === null || deletingCurrent === void 0 ? void 0 : deletingCurrent.originalId);
        });
    }
    transfer({ value, description, pixAddressKey, pixAddressKeyType, }) {
        return __awaiter(this, void 0, void 0, function* () {
            return __classPrivateFieldGet(this, _EasyPix_ApiInterface, "f").createPixTransfer({
                value,
                description,
                pixAddressKey,
                pixAddressKeyType,
                operationType: interfaces_1.OPERATION_TYPE.PIX,
            });
        });
    }
    quit() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                clearInterval(__classPrivateFieldGet(this, _EasyPix_mainLoop, "f"));
                const jobs = node_schedule_1.default.scheduledJobs;
                for (const jobId in jobs) {
                    jobs[jobId].cancel();
                }
                node_schedule_1.default.gracefulShutdown().then(() => {
                    resolve();
                });
            });
        });
    }
}
_EasyPix_API_KEY = new WeakMap(), _EasyPix_configPath = new WeakMap(), _EasyPix_mainLoop = new WeakMap(), _EasyPix_loopSecondsDelay = new WeakMap(), _EasyPix_ApiInterface = new WeakMap(), _EasyPix_dueFunction = new WeakMap(), _EasyPix_paidFunction = new WeakMap(), _EasyPix_provider = new WeakMap(), _EasyPix_instances = new WeakSet(), _EasyPix_init = function _EasyPix_init() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = node_fs_1.default.readFileSync(node_path_1.default.join(__classPrivateFieldGet(this, _EasyPix_configPath, "f"), "config.json"));
            const pendingPixFile = JSON.parse(data.toString());
            pendingPixFile.forEach((pix) => {
                const callJobDate = new Date(pix.expirationDate);
                node_schedule_1.default.scheduleJob(pix.id, callJobDate, __classPrivateFieldGet(this, _EasyPix_instances, "m", _EasyPix_overdue).call(this, pix.id, pix.originalId));
            });
            this.pendingPayments = pendingPixFile;
        }
        catch (e) {
            this.pendingPayments = [];
        }
        __classPrivateFieldSet(this, _EasyPix_mainLoop, setInterval(() => __classPrivateFieldGet(this, _EasyPix_instances, "m", _EasyPix_loop).call(this), __classPrivateFieldGet(this, _EasyPix_loopSecondsDelay, "f") * 1000), "f");
        __classPrivateFieldGet(this, _EasyPix_instances, "m", _EasyPix_loop).call(this);
    });
}, _EasyPix_loop = function _EasyPix_loop() {
    return __awaiter(this, void 0, void 0, function* () {
        const newPendingPayments = [];
        if (this.pendingPayments) {
            yield Promise.all(this.pendingPayments.map((payment) => __awaiter(this, void 0, void 0, function* () {
                const status = yield __classPrivateFieldGet(this, _EasyPix_ApiInterface, "f").getPixPaymentStatusByPaymentId(payment.originalId);
                if (status === interfaces_1.PIX_STATUS.CONFIRMED) {
                    __classPrivateFieldGet(this, _EasyPix_paidFunction, "f").call(this, payment.id, payment.metadata);
                    node_schedule_1.default.cancelJob(payment.id);
                }
                else if (status === interfaces_1.PIX_STATUS.OVERDUE) {
                    __classPrivateFieldGet(this, _EasyPix_dueFunction, "f").call(this, payment.id, payment.metadata);
                    node_schedule_1.default.cancelJob(payment.id);
                }
                else {
                    newPendingPayments.push(payment);
                }
            })));
            this.pendingPayments = newPendingPayments;
            node_fs_1.default.writeFileSync(node_path_1.default.join(__classPrivateFieldGet(this, _EasyPix_configPath, "f"), "config.json"), JSON.stringify(this.pendingPayments));
        }
    });
}, _EasyPix_overdue = function _EasyPix_overdue(id, originalId) {
    return () => __awaiter(this, void 0, void 0, function* () {
        const status = yield __classPrivateFieldGet(this, _EasyPix_ApiInterface, "f").getPixPaymentStatusByPaymentId(originalId);
        const data = this.pendingPayments.find((item) => item.originalId === originalId);
        this.pendingPayments = this.pendingPayments.filter((item) => item.originalId !== originalId);
        node_fs_1.default.writeFileSync(node_path_1.default.join(__classPrivateFieldGet(this, _EasyPix_configPath, "f"), "config.json"), JSON.stringify(this.pendingPayments));
        if (status !== interfaces_1.PIX_STATUS.CONFIRMED) {
            yield __classPrivateFieldGet(this, _EasyPix_ApiInterface, "f").deletePixChargeByPaymentId(originalId);
            return __classPrivateFieldGet(this, _EasyPix_dueFunction, "f").call(this, id, (data === null || data === void 0 ? void 0 : data.metadata) || {});
        }
        else {
            return __classPrivateFieldGet(this, _EasyPix_paidFunction, "f").call(this, id, (data === null || data === void 0 ? void 0 : data.metadata) || {});
        }
    });
};
exports.default = EasyPix;
module.exports = EasyPix;
