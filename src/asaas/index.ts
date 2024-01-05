import axios from "axios";

export default class AssasRequests {
  _ASAAS_BASE_URL: string;
  _ASAAS_KEY: string;

  //use sandbox url by defualt
  constructor(ASAAS_KEY: string | null = null, useSandbox: boolean = true) {
    if (!ASAAS_KEY) throw new Error("Missing asaas api key");

    this._ASAAS_KEY = ASAAS_KEY;
    this._ASAAS_BASE_URL = useSandbox
      ? "https://sandbox.asaas.com/api/v3"
      : "https://api.asaas.com/api/v3";
  }

  async generatePix(options: {
    id: string;
    name: string;
    cpfCnpj: string;
    value: number;
    description: string;
  }): Promise<{
    encodedImage: string;
    payload: string;
    expirationDate: Date;
    originalId: string;
    value: number;
    netValue: number;
  }> {
    const bodyForCustomer = {
      name: options.name,
      cpfCnpj: options.cpfCnpj,
    };

    const createCustomerResponse = await axios.post(
      `${this._ASAAS_BASE_URL}/customers`,
      bodyForCustomer,
      {
        headers: {
          access_token: this._ASAAS_KEY,
        },
      }
    );

    const createdCustomerBody = await createCustomerResponse.data;

    if (createCustomerResponse.status != 200 || !createdCustomerBody.id)
      throw new Error(
        `Error creating the customer, expected and id and status code 200, received status ${
          createCustomerResponse.status
        } and body ${JSON.stringify(createdCustomerBody)}`
      );

    const gmt3 = new Date();

    const year = gmt3.getFullYear() + 1;
    const month = String(gmt3.getMonth() + 1).padStart(2, "0");
    const day = String(gmt3.getDate()).padStart(2, "0");

    const formatedDate = `${year}-${month}-${day}`;

    const createPixPaymentBody: any = {
      customer: createdCustomerBody.id,
      billingType: "PIX",
      value: options.value,
      description: options.description,
      externalReference: options.id,
      dueDate: formatedDate,
      postalService: false,
    };

    const pixPaymentResponse = await axios.post(
      `${this._ASAAS_BASE_URL}/payments`,
      createPixPaymentBody,
      {
        headers: {
          access_token: this._ASAAS_KEY,
        },
      }
    );

    const pixPaymentData = await pixPaymentResponse.data;

    if (pixPaymentResponse.status != 200 || !pixPaymentData.id)
      throw new Error(
        `Error creating the pix, expected and id and status code 200, received status ${
          pixPaymentResponse.status
        } and body ${JSON.stringify(pixPaymentData)}`
      );

    const qrCodeResponse = await axios.get(
      `${this._ASAAS_BASE_URL}/payments/${pixPaymentData.id}/pixQrCode`,
      {
        headers: {
          access_token: this._ASAAS_KEY,
        },
      }
    );

    const qrCodeResponseData = await qrCodeResponse.data;

    if (qrCodeResponse.status != 200 || !qrCodeResponseData.payload)
      throw new Error(
        `Error looking for the qr code, expected status code 200, received status ${
          qrCodeResponse.status
        } and body ${JSON.stringify(qrCodeResponseData)}`
      );

    return {
      encodedImage: qrCodeResponseData.encodedImage,
      payload: qrCodeResponseData.payload,
      expirationDate: qrCodeResponseData.expirationDate,
      originalId: pixPaymentData.id,
      value: pixPaymentData.value,
      netValue: pixPaymentData.netValue,
    };
  }

  async getPixStatus(id: string): Promise<"PENDING" | "CONFIRMED" | "OVERDUE"> {
    const response = await axios.get(
      `${this._ASAAS_BASE_URL}/payments/${id}/status`,
      {
        headers: {
          access_token: this._ASAAS_KEY,
        },
      }
    );

    const data = await response.data;

    if (response.status != 200)
      throw new Error(
        `Error getting the status, expected status code 200, received status ${response.status} and body ${data}`
      );

    switch (data.status) {
      case "RECEIVED":
        return "CONFIRMED";
      case "CONFIRMED":
        return "CONFIRMED";
      case "OVERDUE":
        return "OVERDUE";
      
      default: 
        return "PENDING";
    }
  }

  async delPixCob(id: string): Promise<string> {
    const response = await axios.delete(
      `${this._ASAAS_BASE_URL}/payments/${id}`,
      {
        headers: {
          access_token: this._ASAAS_KEY,
        },
      }
    );

    const data = await response.data;

    if (response.status != 200 || !data.id)
      throw new Error(
        `Error deleting, expected status code 200, received status ${response.status} and body ${data}`
      );

    return data.deleted;
  }

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
    const body = {
      value,
      pixAddressKey,
      pixAddressKeyType,
      description,
      operationType: "PIX",
    };

    const response = await axios.post(
      `${this._ASAAS_BASE_URL}/transfers`,
      body,
      {
        headers: {
          access_token: this._ASAAS_KEY,
        },
      }
    );

    const data = await response.data;

    if (response.status != 200)
      throw new Error(
        `Error transfering, expected status code 200, received status ${response.status} and body ${data}`
      );

    return {
      authorized: data.authorized,
      transferFee: data.transferFee,
      netValue: data.netValue,
      value: data.value,
    };
  }
}

declare var module: any;
module.exports = AssasRequests;
