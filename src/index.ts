import path from "node:path";
import fs from "node:fs";
import nodeSchedule from "node-schedule";

import { ICreatePixPayload, ICreatePixTransferPayload, ICreatePixTransferResult, IPendingPayment, IProvider, OPERATION_TYPE, PIX_ADDRESS_KEY_TYPE, PIX_STATUS, PROVIDERS } from "./shared/interfaces";
import { AsaasProvider } from "./providers";
import { InvalidProvider } from "./shared/errors";

export class EasyPix {
  #API_KEY: string;
  #configPath: string;
  #mainLoop: NodeJS.Timeout | undefined;
  #loopSecondsDelay: number;
  pendingPayments: IPendingPayment[];
  #ApiInterface: IProvider;
  #dueFunction: (id: string, metadata: any) => void;
  #paidFunction: (id: string, metadata: any) => void;
  #provider: PROVIDERS;

  constructor({
    apiKey = null,
    useSandbox = true,
    loopSecondsDelay = 60,
    provider = PROVIDERS.ASAAS,
    configPath = "./"
  }: {
    apiKey?: string | null;
    useSandbox?: boolean;
    loopSecondsDelay?: number;
    provider?: PROVIDERS;
    configPath?: string;

  }
  ) {


    this.#provider = provider;
    this.#API_KEY = apiKey || '';
    const providers = {
      [PROVIDERS.ASAAS]: AsaasProvider,
    }

    if (!providers[provider]) {
      throw new InvalidProvider(provider)
    }

    this.#ApiInterface = new providers[provider]({ API_KEY: apiKey, useSandbox });

    this.#configPath = configPath;
    this.#loopSecondsDelay = loopSecondsDelay;
    this.#mainLoop = undefined;
    this.#dueFunction = () => {};
    this.#paidFunction = () => {};
    this.pendingPayments = [];

    this.#init();
  }

  get apiKey(): string {
    return this.#API_KEY;
  }

  get configPath(): string {
    return this.#configPath;
  }

  get loopSecondsDelay(): number {
    return this.#loopSecondsDelay;
  }

  get provider(): PROVIDERS {
    return this.#provider;
  }

  get step(): () => Promise<void> {
    return this.#loop;
  }

  get overdue(): (id: string, originalId: string) => () => Promise<void> {
    return this.#overdue;
  }

  get dueFunction(): (id: string, metadata: any) => void {
    return this.#dueFunction;
  }

  get paydFunction(): (id: string, metadata: any) => void {
    return this.#paidFunction;
  }

  get apiInterface(): IProvider {
    return this.#ApiInterface;
  }

  async #init() {
    try {
      const data = fs.readFileSync(path.join(this.#configPath, "config.json"));
      const pendingPixFile: IPendingPayment[] = JSON.parse(data.toString());

      pendingPixFile.forEach((pix) => {
        const callJobDate: Date = new Date(pix.expirationDate);
        nodeSchedule.scheduleJob(
          pix.id,
          callJobDate,
          this.#overdue(pix.id, pix.originalId)
        );
      });

      this.pendingPayments = pendingPixFile;
    } catch (e) {
      this.pendingPayments = [];
    }

    this.#mainLoop = setInterval(
      () => this.#loop(),
      this.#loopSecondsDelay * 1000
    );

    this.#loop();
  }

  async #loop() {
    const newPendingPayments: IPendingPayment[] = [];

    if (this.pendingPayments) {
      await Promise.all(
        this.pendingPayments.map(async (payment) => {
          const status = await this.#ApiInterface.getPixPaymentStatusByPaymentId(
            payment.originalId
          );

          if (status === PIX_STATUS.CONFIRMED) {
            this.#paidFunction(payment.id, payment.metadata);
            nodeSchedule.cancelJob(payment.id);
          } else if (status === PIX_STATUS.OVERDUE) {
            this.#dueFunction(payment.id, payment.metadata);
            nodeSchedule.cancelJob(payment.id);
          } else {
            newPendingPayments.push(payment);
          }
        })
      );

      this.pendingPayments = newPendingPayments;

      fs.writeFileSync(
        path.join(this.#configPath, "config.json"),
        JSON.stringify(this.pendingPayments)
      );
    }
  }

  onDue(cb: (id: string, metadata: any) => void): void {
    this.#dueFunction = cb;
  }


  onPaid(cb: (id: string, metadata: any) => void): void {
    this.#paidFunction = cb;
  }

  #overdue(id: string, originalId: string) {
    return async () => {
      const status = await this.#ApiInterface.getPixPaymentStatusByPaymentId(originalId);

      const data = this.pendingPayments.find(
        (item) => item.originalId === originalId
      );

      this.pendingPayments = this.pendingPayments.filter(
        (item) => item.originalId !== originalId
      );

      fs.writeFileSync(
        path.join(this.#configPath, "config.json"),
        JSON.stringify(this.pendingPayments)
      );

      if (status !== PIX_STATUS.CONFIRMED) {
        await this.#ApiInterface.deletePixChargeByPaymentId(originalId);
        return this.#dueFunction(id, data?.metadata || {});
      } else {
        return this.#paidFunction(id, data?.metadata || {});
      }
    };
  }

  async create({
    id,
    name,
    taxId,
    value,
    description,
    metadata = {},
    expiresIn = 5 * 60,
  }: ICreatePixPayload & {
    expiresIn?: number,
    metadata?: { [key: string]: any }
  }): Promise<{
    encodedImage: string;
    payload: string;
    expirationDate: Date;
    value: number;
    netValue: number;
  }> {
    const pix = await this.#ApiInterface.createPixPayment({
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

    fs.writeFileSync(
      path.join(this.#configPath, "config.json"),
      JSON.stringify(this.pendingPayments)
    );

    const callJobDate: Date = new Date(expirationDate);
    nodeSchedule.scheduleJob(
      id,
      callJobDate,
      this.#overdue(id, pix.originalId)
    );

    return {
      ...pix,
      expirationDate,
    };
  }

  async deleteCob(id: string): Promise<void> {
    const deletingCurrent = this.pendingPayments.find((item) => item.id === id);

    this.pendingPayments = this.pendingPayments.filter(
      (item) => item.id !== id
    );

    fs.writeFileSync(
      path.join(this.#configPath, "config.json"),
      JSON.stringify(this.pendingPayments)
    );

    nodeSchedule.cancelJob(id);

    await this.#ApiInterface.deletePixChargeByPaymentId(deletingCurrent?.originalId as string);
  }

  async transfer({
    value,
    description,
    pixAddressKey,
    pixAddressKeyType,
  }: ICreatePixTransferPayload): Promise<ICreatePixTransferResult> {
    return this.#ApiInterface.createPixTransfer({
      value,
      description,
      pixAddressKey,
      pixAddressKeyType,
      operationType: OPERATION_TYPE.PIX,
    });
  }

  async quit(): Promise<void> {
    return new Promise((resolve) => {
      clearInterval(this.#mainLoop);

      const jobs = nodeSchedule.scheduledJobs;
      for (const jobId in jobs) {
        jobs[jobId].cancel();
      }

      nodeSchedule.gracefulShutdown().then(() => {
        resolve();
      });
    });
  }
}