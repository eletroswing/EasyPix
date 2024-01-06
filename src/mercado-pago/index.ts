import axios from "axios";

export default class MercadopagoRequests {
  _MP_BASE_URL: string;
  _MP_KEY: string;
  #MP_KEY: string;

  //use sandbox url by defualt
  constructor(MP_KEY: string | null = null, useSandbox: boolean = true) {
    if (!MP_KEY) throw new Error("Missing mercado-pago api key");

    this._MP_KEY = MP_KEY;
    this.#MP_KEY = `Bearer ${MP_KEY}`;
    this._MP_BASE_URL = `https://api.mercadopago.com/v1`;
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
    const body = {
      description: options.description,
      transaction_amount: options.value,
      payment_method_id: "pix",
      payer: {
        email: options.cpfCnpj,
      },
      external_reference: options.id,
    };

    const createPaymentData = await axios.post(
      `${this._MP_BASE_URL}/payments`,
      body,
      {
        headers: {
          Authorization: this.#MP_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const createPaymentBody = await createPaymentData.data;

    if (createPaymentData.status != 200 && createPaymentData.status != 201)
      throw new Error(
        `Error creating the pix, expected status code 200 or 201, received status ${
          createPaymentData.status
        } and body ${JSON.stringify(createPaymentBody)}`
      );

    const gmt3 = new Date();

    const year = gmt3.getFullYear() + 1;
    const month = String(gmt3.getMonth() + 1).padStart(2, "0");
    const day = String(gmt3.getDate()).padStart(2, "0");

    const formatedDate = `${year}-${month}-${day}`;

    return {
      encodedImage: createPaymentBody.point_of_interaction.transaction_data.qr_code_base64,
      payload: createPaymentBody.point_of_interaction.transaction_data.qr_code,
      expirationDate: new Date(
        createPaymentBody.date_of_expiration || formatedDate
      ),
      originalId: createPaymentBody.id?.toString() as string,
      value: options.value,
      netValue: options.value - (createPaymentBody.taxes_amount || 0),
    };
  }

  async getPixStatus(id: string): Promise<"PENDING" | "CONFIRMED" | "OVERDUE"> {
    const response = await axios.get(`${this._MP_BASE_URL}/payments/${id}`, {
      headers: {
        Authorization: this.#MP_KEY,
        "Content-Type": "application/json",
      },
    });

    const data = await response.data;

    if (response.status != 200 || !data.status)
      throw new Error(
        `Error getting the status, expected status code 200, received status ${response.status} and body ${data}`
      );

    switch (data.status) {
      case "approved":
        return "CONFIRMED";
      case "authorized":
        return "CONFIRMED";
      case "cancelled":
        return "OVERDUE";
      case "rejected":
        return "OVERDUE";
      default:
        return "PENDING";
    }
  }

  async delPixCob(id: string): Promise<boolean> {
    await axios.put(
      `${this._MP_BASE_URL}/payments/${id}`,
      { status: "cancelled" },
      {
        headers: {
          Authorization: this.#MP_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    return true;
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
   throw new Error(`Not implemented by the gatway`);
  }
}

declare var module: any;
module.exports = MercadopagoRequests;
