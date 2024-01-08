import { EasyPix } from "./../src/index";
import { MercadoPagoProvider, AsaasProvider } from "../src/providers/index";

import path from "node:path";
import fs from "node:fs";
import { OPERATION_TYPE, PIX_ADDRESS_KEY_TYPE, PROVIDERS } from "../src/shared/interfaces";

jest.useFakeTimers();

jest.mock("fs");
jest.mock("path");
jest.mock("./../src/providers/AsaasProvider");
jest.mock("./../src/providers/MercadoPagoProvider");

const mockedAsaasProvider = AsaasProvider as jest.Mocked<typeof AsaasProvider>;
const mockedMercadoPagoProvider = MercadoPagoProvider as jest.Mocked<typeof MercadoPagoProvider>;

describe("Easy Pix", () => {
  describe("Asaas default", () => {
    beforeEach(() => {
      fs.writeFileSync(path.join("./", "config.json"), JSON.stringify([]));
    });

    test("Constructor creates instance with valid API key, and be type of asaas", async () => {
      const easyPix = new EasyPix({ apiKey: "valid_api_key"});
      await easyPix.quit();

      expect(easyPix).toBeInstanceOf(EasyPix);
      expect(easyPix.provider).toBe("ASAAS");
      expect(easyPix.apiInterface).toBeInstanceOf(AsaasProvider);
      expect(easyPix.configPath).toBe("./");
      expect(easyPix.loopSecondsDelay).toBe(60);
      expect(easyPix.apiKey).toBe("valid_api_key");

      await easyPix.quit();
      jest.runOnlyPendingTimers();
    });

    test("Create method generates Pix and adds to pending payments", async () => {
      mockedAsaasProvider.prototype.createPixPayment = jest
        .fn()
        .mockResolvedValue({
          encodedImage: "mocked_encoded_image",
          payload: "mocked_payload",
          expirationDate: new Date(),
          originalId: "mocked_original_id",
          value: 100,
          netValue: 98,
        });

      const easyPix = new EasyPix({ apiKey: "valid_api_key" });
      await easyPix.quit();

      easyPix.pendingPayments = [];

      const result = await easyPix.create({
        id: "123",
        name: "John Doe",
        taxId: "123456789",
        value: 100,
        description: "Test Pix",
      });

      expect(AsaasProvider.prototype.createPixPayment).toHaveBeenCalledWith({
        taxId: "123456789",
        description: "Test Pix",
        id: "123",
        name: "John Doe",
        value: 100,
      });

      expect(result).toEqual({
        originalId: "mocked_original_id",
        encodedImage: "mocked_encoded_image",
        payload: "mocked_payload",
        expirationDate: expect.any(Date),
        value: 100,
        netValue: 98,
      });

      expect(easyPix.pendingPayments).toEqual([
        {
          id: "123",
          originalId: "mocked_original_id",
          expirationDate: expect.any(Date),
          metadata: {},
          value: 100,
          netValue: 98,
        },
      ]);

      jest.runOnlyPendingTimers();
    });

    test("DeleteCob method removes payment from pending payments", async () => {
      mockedAsaasProvider.prototype.deletePixChargeByPaymentId = jest
        .fn()
        .mockResolvedValue({
          deleted: true,
        });

      const easyPix = new EasyPix({ apiKey: "valid_api_key" });
      await easyPix.quit();

      easyPix.pendingPayments = [
        {
          id: "123",
          originalId: "mocked_original_id",
          expirationDate: new Date(),
          metadata: {},
          value: 100,
          netValue: 98,
        },
      ];

      await easyPix.deleteCob("123");

      expect(easyPix.pendingPayments).toEqual([]);
      expect(
        AsaasProvider.prototype.deletePixChargeByPaymentId
      ).toHaveBeenCalledWith("mocked_original_id");

      jest.runOnlyPendingTimers();
    });

    test("Transfer method calls AsaasProvider", async () => {
      mockedAsaasProvider.prototype.createPixTransfer = jest
        .fn()
        .mockResolvedValue({
          authorized: true,
          transferFee: 2,
          netValue: 98,
          value: 100,
        });

      const easyPix = new EasyPix({ apiKey: "valid_api_key" });
      await easyPix.quit();

      const result = await easyPix.transfer({
        value: 100,
        pixAddressKey: "john@example.com",
        pixAddressKeyType: PIX_ADDRESS_KEY_TYPE.EMAIL,
        description: "Transfer description",
        operationType: OPERATION_TYPE.PIX,
      });

      expect(AsaasProvider.prototype.createPixTransfer).toHaveBeenCalledWith({
        value: 100,
        pixAddressKey: "john@example.com",
        pixAddressKeyType: PIX_ADDRESS_KEY_TYPE.EMAIL,
        description: "Transfer description",
        operationType: OPERATION_TYPE.PIX,
      });

      expect(result).toEqual({
        authorized: true,
        transferFee: 2,
        netValue: 98,
        value: 100,
      });

      jest.runOnlyPendingTimers();
    });

    test("OnDue callback is called when payment is overdue", async () => {
      mockedAsaasProvider.prototype.getPixPaymentStatusByPaymentId = jest
        .fn()
        .mockResolvedValue("OVERDUE");

      const easyPix = new EasyPix({ apiKey: "valid_api_key" });
      await easyPix.quit();

      const callbackMock = jest.fn();
      easyPix.onDue(callbackMock);

      easyPix.pendingPayments = [
        {
          id: "123",
          originalId: "mocked_original_id",
          expirationDate: new Date(),
          metadata: {},
          value: 100,
          netValue: 98,
        },
      ];

      await easyPix.step();

      expect(callbackMock).toHaveBeenCalledWith("123", {});

      jest.runOnlyPendingTimers();
    });

    test("OnPaid callback is called when payment is confirmed", async () => {
      mockedAsaasProvider.prototype.getPixPaymentStatusByPaymentId = jest
        .fn()
        .mockResolvedValue("CONFIRMED");

      const easyPix = new EasyPix({ apiKey: "valid_api_key" });
      const callbackMock = jest.fn();
      easyPix.onPaid(callbackMock);

      easyPix.pendingPayments = [
        {
          id: "123",
          originalId: "mocked_original_id",
          expirationDate: new Date(),
          metadata: {},
          value: 100,
          netValue: 98,
        },
      ];

      await easyPix.step();

      expect(callbackMock).toHaveBeenCalledWith("123", {});
      await easyPix.quit();
      jest.runOnlyPendingTimers();
    });

    test("#overdue method handles overdue payment correctly", async () => {
      mockedAsaasProvider.prototype.getPixPaymentStatusByPaymentId = jest
        .fn()
        .mockResolvedValue("OVERDUE");
      mockedAsaasProvider.prototype.deletePixChargeByPaymentId = jest
        .fn()
        .mockResolvedValue({ deleted: true });

      const easyPix = new EasyPix({ apiKey: "valid_api_key" });
      await easyPix.quit();

      easyPix.pendingPayments = [
        {
          id: "123",
          originalId: "mocked_original_id",
          expirationDate: new Date(),
          metadata: { somedata: 0 },
          value: 100,
          netValue: 98,
        },
      ];

      const mockDueFunction = jest.fn();
      easyPix.onDue(mockDueFunction);

      await easyPix.overdue("123", "mocked_original_id")();

      expect(
        AsaasProvider.prototype.deletePixChargeByPaymentId
      ).toHaveBeenCalledWith("mocked_original_id");

      expect(mockDueFunction).toHaveBeenCalledWith("123", { somedata: 0 });

      jest.runOnlyPendingTimers();
    });

    test("#overdue method handles confirmed payment correctly", async () => {
      mockedAsaasProvider.prototype.getPixPaymentStatusByPaymentId = jest
        .fn()
        .mockResolvedValue("CONFIRMED");

      const easyPix = new EasyPix({ apiKey: "valid_api_key" });
      await easyPix.quit();

      easyPix.pendingPayments = [
        {
          id: "123",
          originalId: "mocked_original_id",
          expirationDate: new Date(),
          metadata: {},
          value: 100,
          netValue: 98,
        },
      ];

      const mockDueFunction = jest.fn();
      easyPix.onPaid(mockDueFunction);

      await easyPix.overdue("123", "mocked_original_id")();

      expect(mockDueFunction).toHaveBeenCalledWith("123", {});

      jest.runOnlyPendingTimers();
    });

    test("#init method loads pending payments from config file", async () => {
      mockedAsaasProvider.prototype.getPixPaymentStatusByPaymentId = jest
        .fn()
        .mockResolvedValue("PENDING");

      const date = new Date();

      jest.spyOn(fs, "readFileSync").mockReturnValue(
        JSON.stringify([
          {
            id: "123",
            originalId: "mocked_original_id",
            expirationDate: date,
            metadata: {},
            value: 100,
            netValue: 98,
          },
        ])
      );

      const easyPix = new EasyPix({ apiKey: "valid_api_key" });
      await easyPix.quit();

      expect(fs.readFileSync).toHaveBeenCalledWith(
        path.join("./", "config.json")
      );

      expect(easyPix.pendingPayments).toEqual([
        {
          id: "123",
          originalId: "mocked_original_id",
          expirationDate: date.toISOString(),
          metadata: {},
          value: 100,
          netValue: 98,
        },
      ]);
    });

    test("#loop method processes pending payments and updates config file. Paid", async () => {
      mockedAsaasProvider.prototype.getPixPaymentStatusByPaymentId = jest
        .fn()
        .mockResolvedValue("CONFIRMED");

      const easyPix = new EasyPix({ apiKey: "valid_api_key" });
      await easyPix.quit();

      jest.spyOn(fs, "writeFileSync");

      const date = new Date();

      const paidMockFunction = jest.fn();

      easyPix.onPaid(paidMockFunction);

      easyPix.pendingPayments = [
        {
          id: "123",
          originalId: "mocked_original_id_1",
          expirationDate: date,
          metadata: {},
          value: 100,
          netValue: 98,
        },
      ];

      await easyPix.step();

      expect(
        AsaasProvider.prototype.getPixPaymentStatusByPaymentId
      ).toHaveBeenCalledWith("mocked_original_id_1");

      expect(paidMockFunction).toHaveBeenCalledWith("123", {});
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        path.join("./", "config.json"),
        JSON.stringify([])
      );
    });
  });

  describe("Mercado Pago", () => {
    beforeEach(() => {
      fs.writeFileSync(path.join("./", "config.json"), JSON.stringify([]));
    });

    test("Constructor creates instance with valid API key, and be type of mercado pago", async () => {
      const easyPix = new EasyPix({ apiKey: "valid_api_key", provider: PROVIDERS.MERCADO_PAGO });
      await easyPix.quit();

      expect(easyPix).toBeInstanceOf(EasyPix);
      expect(easyPix.provider).toBe("MERCADO_PAGO");
      expect(easyPix.apiInterface).toBeInstanceOf(MercadoPagoProvider);
      expect(easyPix.configPath).toBe("./");
      expect(easyPix.loopSecondsDelay).toBe(60);
      expect(easyPix.apiKey).toBe("valid_api_key");

      await easyPix.quit();
      jest.runOnlyPendingTimers();
    });

    test("Create method generates Pix and adds to pending payments", async () => {
      mockedMercadoPagoProvider.prototype.createPixPayment = jest
        .fn()
        .mockResolvedValue({
          encodedImage: "mocked_encoded_image",
          payload: "mocked_payload",
          expirationDate: new Date(),
          originalId: "mocked_original_id",
          value: 100,
          netValue: 98,
        });

      const easyPix = new EasyPix({ apiKey: "valid_api_key", provider: PROVIDERS.MERCADO_PAGO });
      await easyPix.quit();

      easyPix.pendingPayments = [];

      const result = await easyPix.create({
        id: "123",
        name: "John Doe",
        taxId: "123456789",
        value: 100,
        description: "Test Pix",
      });

      expect(AsaasProvider.prototype.createPixPayment).toHaveBeenCalledWith({
        taxId: "123456789",
        description: "Test Pix",
        id: "123",
        name: "John Doe",
        value: 100,
      });

      expect(result).toEqual({
        originalId: "mocked_original_id",
        encodedImage: "mocked_encoded_image",
        payload: "mocked_payload",
        expirationDate: expect.any(Date),
        value: 100,
        netValue: 98,
      });

      expect(easyPix.pendingPayments).toEqual([
        {
          id: "123",
          originalId: "mocked_original_id",
          expirationDate: expect.any(Date),
          metadata: {},
          value: 100,
          netValue: 98,
        },
      ]);

      jest.runOnlyPendingTimers();
    });

    test("DeleteCob method removes payment from pending payments", async () => {
      mockedMercadoPagoProvider.prototype.deletePixChargeByPaymentId = jest
        .fn()
        .mockResolvedValue({
          deleted: true,
        });

      const easyPix = new EasyPix({ apiKey: "valid_api_key", provider: PROVIDERS.MERCADO_PAGO });
      await easyPix.quit();

      easyPix.pendingPayments = [
        {
          id: "123",
          originalId: "mocked_original_id",
          expirationDate: new Date(),
          metadata: {},
          value: 100,
          netValue: 98,
        },
      ];

      await easyPix.deleteCob("123");

      expect(easyPix.pendingPayments).toEqual([]);
      expect(
        AsaasProvider.prototype.deletePixChargeByPaymentId
      ).toHaveBeenCalledWith("mocked_original_id");

      jest.runOnlyPendingTimers();
    });

    test("Transfer method calls AsaasProvider", async () => {
      mockedMercadoPagoProvider.prototype.createPixTransfer = jest
        .fn()
        .mockResolvedValue({
          authorized: true,
          transferFee: 2,
          netValue: 98,
          value: 100,
        });

      const easyPix = new EasyPix({ apiKey: "valid_api_key", provider: PROVIDERS.MERCADO_PAGO });
      await easyPix.quit();

      const result = await easyPix.transfer({
        value: 100,
        pixAddressKey: "john@example.com",
        pixAddressKeyType: PIX_ADDRESS_KEY_TYPE.EMAIL,
        description: "Transfer description",
        operationType: OPERATION_TYPE.PIX,
      });

      expect(AsaasProvider.prototype.createPixTransfer).toHaveBeenCalledWith({
        value: 100,
        pixAddressKey: "john@example.com",
        pixAddressKeyType: PIX_ADDRESS_KEY_TYPE.EMAIL,
        description: "Transfer description",
        operationType: OPERATION_TYPE.PIX,
      });

      expect(result).toEqual({
        authorized: true,
        transferFee: 2,
        netValue: 98,
        value: 100,
      });

      jest.runOnlyPendingTimers();
    });

    test("OnDue callback is called when payment is overdue", async () => {
      mockedMercadoPagoProvider.prototype.getPixPaymentStatusByPaymentId = jest
        .fn()
        .mockResolvedValue("OVERDUE");

      const easyPix = new EasyPix({ apiKey: "valid_api_key", provider: PROVIDERS.MERCADO_PAGO });
      await easyPix.quit();

      const callbackMock = jest.fn();
      easyPix.onDue(callbackMock);

      easyPix.pendingPayments = [
        {
          id: "123",
          originalId: "mocked_original_id",
          expirationDate: new Date(),
          metadata: {},
          value: 100,
          netValue: 98,
        },
      ];

      await easyPix.step();

      expect(callbackMock).toHaveBeenCalledWith("123", {});

      jest.runOnlyPendingTimers();
    });

    test("OnPaid callback is called when payment is confirmed", async () => {
      mockedMercadoPagoProvider.prototype.getPixPaymentStatusByPaymentId = jest
        .fn()
        .mockResolvedValue("CONFIRMED");

      const easyPix = new EasyPix({ apiKey: "valid_api_key", provider: PROVIDERS.MERCADO_PAGO });
      const callbackMock = jest.fn();
      easyPix.onPaid(callbackMock);

      easyPix.pendingPayments = [
        {
          id: "123",
          originalId: "mocked_original_id",
          expirationDate: new Date(),
          metadata: {},
          value: 100,
          netValue: 98,
        },
      ];

      await easyPix.step();

      expect(callbackMock).toHaveBeenCalledWith("123", {});
      await easyPix.quit();
      jest.runOnlyPendingTimers();
    });

    test("#overdue method handles overdue payment correctly", async () => {
      mockedMercadoPagoProvider.prototype.getPixPaymentStatusByPaymentId = jest
        .fn()
        .mockResolvedValue("OVERDUE");
      mockedMercadoPagoProvider.prototype.deletePixChargeByPaymentId = jest
        .fn()
        .mockResolvedValue({ deleted: true });

      const easyPix = new EasyPix({ apiKey: "valid_api_key", provider: PROVIDERS.MERCADO_PAGO });
      await easyPix.quit();

      easyPix.pendingPayments = [
        {
          id: "123",
          originalId: "mocked_original_id",
          expirationDate: new Date(),
          metadata: { somedata: 0 },
          value: 100,
          netValue: 98,
        },
      ];

      const mockDueFunction = jest.fn();
      easyPix.onDue(mockDueFunction);

      await easyPix.overdue("123", "mocked_original_id")();

      expect(
        AsaasProvider.prototype.deletePixChargeByPaymentId
      ).toHaveBeenCalledWith("mocked_original_id");

      expect(mockDueFunction).toHaveBeenCalledWith("123", { somedata: 0 });

      jest.runOnlyPendingTimers();
    });

    test("#overdue method handles confirmed payment correctly", async () => {
      mockedMercadoPagoProvider.prototype.getPixPaymentStatusByPaymentId = jest
        .fn()
        .mockResolvedValue("CONFIRMED");

      const easyPix = new EasyPix({ apiKey: "valid_api_key", provider: PROVIDERS.MERCADO_PAGO });
      await easyPix.quit();

      easyPix.pendingPayments = [
        {
          id: "123",
          originalId: "mocked_original_id",
          expirationDate: new Date(),
          metadata: {},
          value: 100,
          netValue: 98,
        },
      ];

      const mockDueFunction = jest.fn();
      easyPix.onPaid(mockDueFunction);

      await easyPix.overdue("123", "mocked_original_id")();

      expect(mockDueFunction).toHaveBeenCalledWith("123", {});

      jest.runOnlyPendingTimers();
    });

    test("#init method loads pending payments from config file", async () => {
      mockedMercadoPagoProvider.prototype.getPixPaymentStatusByPaymentId = jest
        .fn()
        .mockResolvedValue("PENDING");

      const date = new Date();

      jest.spyOn(fs, "readFileSync").mockReturnValue(
        JSON.stringify([
          {
            id: "123",
            originalId: "mocked_original_id",
            expirationDate: date,
            metadata: {},
            value: 100,
            netValue: 98,
          },
        ])
      );

      const easyPix = new EasyPix({ apiKey: "valid_api_key", provider: PROVIDERS.MERCADO_PAGO });
      await easyPix.quit();

      expect(fs.readFileSync).toHaveBeenCalledWith(
        path.join("./", "config.json")
      );

      expect(easyPix.pendingPayments).toEqual([
        {
          id: "123",
          originalId: "mocked_original_id",
          expirationDate: date.toISOString(),
          metadata: {},
          value: 100,
          netValue: 98,
        },
      ]);
    });

    test("#loop method processes pending payments and updates config file. Paid", async () => {
      mockedMercadoPagoProvider.prototype.getPixPaymentStatusByPaymentId = jest
        .fn()
        .mockResolvedValue("CONFIRMED");

      const easyPix = new EasyPix({ apiKey: "valid_api_key", provider: PROVIDERS.MERCADO_PAGO });
      await easyPix.quit();

      jest.spyOn(fs, "writeFileSync");

      const date = new Date();

      const paidMockFunction = jest.fn();

      easyPix.onPaid(paidMockFunction);

      easyPix.pendingPayments = [
        {
          id: "123",
          originalId: "mocked_original_id_1",
          expirationDate: date,
          metadata: {},
          value: 100,
          netValue: 98,
        },
      ];

      await easyPix.step();

      expect(
        AsaasProvider.prototype.getPixPaymentStatusByPaymentId
      ).toHaveBeenCalledWith("mocked_original_id_1");

      expect(paidMockFunction).toHaveBeenCalledWith("123", {});
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        path.join("./", "config.json"),
        JSON.stringify([])
      );
    });
  });
});
