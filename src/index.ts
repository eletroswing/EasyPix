import path from "node:path";
import fs from "node:fs";
import nodeSchedule from "node-schedule";

import AssasRequests from "./asaas";

// Enum for providers
enum Provider {
  ASAAS = "ASAAS",
}

interface PendingPayment {
  id: string;
  originalId: string;
  expirationDate: Date;
  metadata: any;
  value: number;
  netValue: number;
}

export default class EasyPix {
  #API_KEY: string;
  #configPath: string;
  #mainLoop: NodeJS.Timeout | undefined;
  #loopSecondsDelay: number;
  pendingPayments: PendingPayment[];
  #ApiInterface: AssasRequests;
  #dueFunction: (id: string, metadata: any) => void;
  #paidFunction: (id: string, metadata: any) => void;
  #provider: Provider;

  constructor(
    apiKey: string | null = null,
    useSandbox: boolean = true,
    loopSecondsDelay: number = 60,
    provider: Provider = Provider.ASAAS,
    configPath: string = "./"
  ) {
    this.#provider = provider;
    this.#API_KEY = apiKey as string;

    switch (provider) {
      default:
        if (!apiKey)
          throw new Error(
            "Missing Asaas api key. Take a look on https://docs.asaas.com/docs/autenticacao and get yours."
          );
        this.#ApiInterface = new AssasRequests(this.#API_KEY, useSandbox);
    }

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

  get provider(): Provider {
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

  get apiInterface(): AssasRequests {
    return this.#ApiInterface;
  }

  /**
   * Initialize EasyPix instance.
   */
  async #init() {
    // Load the pending pix from config
    try {
      const data = fs.readFileSync(path.join(this.#configPath, "config.json"));
      const pendingPixFile: PendingPayment[] = JSON.parse(data.toString());

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

  /**
   * Main loop for processing pending payments.
   */
  async #loop() {
    const newPendingPayments: PendingPayment[] = [];

    if (this.pendingPayments) {
      await Promise.all(
        this.pendingPayments.map(async (payment) => {
          const status = await this.#ApiInterface.getPixStatus(
            payment.originalId
          );

          if (status == "CONFIRMED") {
            this.#paidFunction(payment.id, payment.metadata);
            nodeSchedule.cancelJob(payment.id);
          } else if (status == "OVERDUE") {
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

  /**
   * Set a callback for when a payment is due.
   * @param cb - Callback function.
   */
  onDue(cb: (id: string, metadata: any) => void): void {
    this.#dueFunction = cb;
  }

  /**
   * Set a callback for when a payment is paid.
   * @param cb - Callback function.
   */
  onPaid(cb: (id: string, metadata: any) => void): void {
    this.#paidFunction = cb;
  }

  /**
   * Callback function for overdue payments.
   * @param id - Payment ID.
   * @param originalId - Original payment ID.
   * @returns Callback function.
   */
  #overdue(id: string, originalId: string) {
    return async () => {
      const status = await this.#ApiInterface.getPixStatus(originalId);

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

      if (status !== "CONFIRMED") {
        await this.#ApiInterface.delPixCob(originalId);
        return this.#dueFunction(id, data?.metadata || {}); // Adicionando verificação para evitar undefined
      } else {
        return this.#paidFunction(id, data?.metadata || {}); // Adicionando verificação para evitar undefined
      }
    };
  }

  /**
   * Create a new payment.
   * @param id - Payment ID.
   * @param clientName - Client name.
   * @param cpfCnpj - Client CPF/CNPJ.
   * @param value - Payment value.
   * @param description - Payment description.
   * @param expiresIn - Payment expiration time (in seconds).
   * @param metadata - Payment metadata.
   * @returns Payment details.
   */
  async create(
    id: string,
    clientName: string,
    cpfCnpj: string,
    value: number,
    description: string,
    expiresIn: number = 5 * 60,
    metadata: any = {}
  ): Promise<{
    encodedImage: string;
    payload: string;
    expirationDate: Date;
    value: number;
    netValue: number;
  }> {
    const pix = await this.#ApiInterface.generatePix({
      cpfCnpj: cpfCnpj,
      description: description,
      id: id,
      name: clientName,
      value: value,
    });

    if (expiresIn < 60 || expiresIn > 60 * 60 * 48) {
      throw new Error(`Expires in must be in the range 60 seconds to 48 hours`);
    }

    const now = new Date();
    const expireAtDate = new Date(now.getTime() + expiresIn * 1000);

    // Insert the pix on the pending pixes
    this.pendingPayments.push({
      id: id,
      originalId: pix.originalId,
      expirationDate: expireAtDate,
      metadata: metadata,
      value: pix.value,
      netValue: pix.netValue,
    });

    fs.writeFileSync(
      path.join(this.#configPath, "config.json"),
      JSON.stringify(this.pendingPayments)
    );

    // Save the job on overdue pix check
    const callJobDate: Date = new Date(expireAtDate);
    nodeSchedule.scheduleJob(
      id,
      callJobDate,
      this.#overdue(id, pix.originalId)
    );

    return {
      encodedImage: pix.encodedImage,
      expirationDate: expireAtDate,
      payload: pix.payload,
      value: pix.value,
      netValue: pix.netValue,
    };
  }

  /**
   * Delete a payment.
   * @param id - Payment ID.
   */
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

    await this.#ApiInterface.delPixCob(deletingCurrent?.originalId as string);
  }

  /**
   * Transfer money.
   * @param value - Amount to transfer.
   * @param pixAddressKey - PIX address key.
   * @param pixAddressKeyType - Type of PIX address key (CPF, EMAIL, CNPJ, PHONE, EVP).
   * @param description - Transfer description.
   * @returns Transfer details.
   */
  async transfer(
    value: number,
    pixAddressKey: string,
    pixAddressKeyType: "CPF" | "EMAIL" | "CNPJ" | "PHONE" | "EVP",
    description: string
  ): Promise<{
    authorized: boolean;
    transferFee: number;
    netValue: number;
    value: number;
  }> {
    return this.#ApiInterface.transfer(
      value,
      pixAddressKey,
      pixAddressKeyType,
      description
    );
  }

  /**
   * Quit EasyPix instance.
   */
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

declare var module: any;
module.exports = EasyPix;
