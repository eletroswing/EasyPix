const EasyPix = require("./../dist/index.js");
const fs = require("node:fs");
const path = require("node:path");
const { AsaasProvider } = require("../dist/providers/index.js");

jest.useFakeTimers();

jest.mock("./../dist/providers/index.js");

jest.mock("./../dist/clients/HttpClient", () => ({
  post: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  put: jest.fn(),
}));
jest.mock("axios");

beforeEach(() => {
  fs.writeFileSync(path.join("./", "config.json"), JSON.stringify([]));
});

describe("Easy Pix", () => {
  describe("Asaas default", () => {
    test("Constructor throws error when API key is missing", () => {
      expect(() => new EasyPix()).toThrow(
        "Cannot read properties of undefined (reading 'apiKey')"
      );
    });

    test("Constructor creates instance with valid API key, and be type of asaas", async () => {
      const easyPix = new EasyPix({ apiKey: "valid_api_key" });
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
      const scheduleMock = require("node-schedule");
    
      jest.spyOn(AsaasProvider.prototype, 'createPixPayment').mockResolvedValue({
        originalId: "mocked_original_id",
        value: 100,
        netValue: 98,
        encodedImage: "mocked_encoded_image",
        payload: "mocked_payload",
      });
    
      const easyPix = new EasyPix({ apiKey: "valid_api_key" });
    
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
        encodedImage: "mocked_encoded_image",
        payload: "mocked_payload",
        expirationDate: expect.any(Date),
        originalId: "mocked_original_id",
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
      jest.spyOn(AsaasProvider.prototype, 'deletePixChargeByPaymentId').mockResolvedValue({
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
      expect(AsaasProvider.prototype.deletePixChargeByPaymentId).toHaveBeenCalledWith("mocked_original_id");
    
      jest.runOnlyPendingTimers();
    });

    test("Transfer method calls AsaasRequests.createPixTransfer", async () => {
      jest.spyOn(AsaasProvider.prototype, 'createPixTransfer').mockResolvedValue({
        authorized: true,
        transferFee: 2,
        netValue: 98,
        value: 100,
      });
    
      const easyPix = new EasyPix({ apiKey: "valid_api_key" });
    
      const result = await easyPix.transfer(
        100,
        "john@example.com",
        "EMAIL",
        "Transfer description"
      );
    
      expect(result).toEqual({
        authorized: true,
        transferFee: 2,
        netValue: 98,
        value: 100,
      });
    
      jest.runOnlyPendingTimers();
    });

    test("OnDue callback is called when payment is overdue", async () => {
      jest.spyOn(AsaasProvider.prototype, 'getPixPaymentStatusByPaymentId').mockResolvedValue("OVERDUE");
    
      const easyPix = new EasyPix({ apiKey: "valid_api_key" });
      await easyPix.quit();

      const callbackMock = jest.fn();
      easyPix.onDue(callbackMock);
    
      const pastExpirationDate = new Date();
      pastExpirationDate.setMinutes(pastExpirationDate.getMinutes() - 10); // 10 minutes ago
      easyPix.pendingPayments = [
        {
          id: "123",
          originalId: "mocked_original_id",
          expirationDate: pastExpirationDate,
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

    test("OnPaid callback is called when payment is confirmed", async () => {
      jest.spyOn(AsaasProvider.prototype, 'getPixPaymentStatusByPaymentId').mockResolvedValue("CONFIRMED");
    
      const easyPix = new EasyPix({ apiKey: "valid_api_key" });
      await easyPix.quit();

      const callbackMock = jest.fn();
      easyPix.onPaid(callbackMock);
    
      const pastExpirationDate = new Date();
      pastExpirationDate.setMinutes(pastExpirationDate.getMinutes() - 10); // 10 minutes ago
      easyPix.pendingPayments = [
        {
          id: "123",
          originalId: "mocked_original_id",
          expirationDate: pastExpirationDate,
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

    test("OnDue callback is called when payment is overdue - With Metadata", async () => {
      jest.spyOn(AsaasProvider.prototype, 'getPixPaymentStatusByPaymentId').mockResolvedValue("OVERDUE");
    
      const easyPix = new EasyPix({ apiKey: "valid_api_key" });
      await easyPix.quit();

      const callbackMock = jest.fn();
      easyPix.onDue(callbackMock);
    
      const pastExpirationDate = new Date();
      pastExpirationDate.setMinutes(pastExpirationDate.getMinutes() - 10); // 10 minutes ago
      easyPix.pendingPayments = [
        {
          id: "123",
          originalId: "mocked_original_id",
          expirationDate: pastExpirationDate,
          metadata: {name: "ollaf"},
          value: 100,
          netValue: 98,
        },
      ];
    
      await easyPix.step();
    
      expect(callbackMock).toHaveBeenCalledWith("123", {name: "ollaf"});
    
      await easyPix.quit();
      jest.runOnlyPendingTimers();
    });

    test("OnPaid callback is called when payment is confirmed - With Metadata", async () => {
      jest.spyOn(AsaasProvider.prototype, 'getPixPaymentStatusByPaymentId').mockResolvedValue("CONFIRMED");
    
      const easyPix = new EasyPix({ apiKey: "valid_api_key" });
      await easyPix.quit();

      const callbackMock = jest.fn();
      easyPix.onPaid(callbackMock);
    
      const pastExpirationDate = new Date();
      pastExpirationDate.setMinutes(pastExpirationDate.getMinutes() - 10); // 10 minutes ago
      easyPix.pendingPayments = [
        {
          id: "123",
          originalId: "mocked_original_id",
          expirationDate: pastExpirationDate,
          metadata: {name: "ollaf"},
          value: 100,
          netValue: 98,
        },
      ];
    
      await easyPix.step();
    
      expect(callbackMock).toHaveBeenCalledWith("123", {name: "ollaf"});
    
      await easyPix.quit();
      jest.runOnlyPendingTimers();
    });

    test("#overdue method handles overdue payment correctly", async () => {
      jest.spyOn(AsaasProvider.prototype, 'getPixPaymentStatusByPaymentId').mockResolvedValue("OVERDUE");
  
      jest.spyOn(AsaasProvider.prototype, 'deletePixChargeByPaymentId').mockResolvedValue({ deleted: true });
    
      const easyPix = new EasyPix({ apiKey: "valid_api_key" });
      await easyPix.quit();
    
      const pastExpirationDate = new Date();
      pastExpirationDate.setMinutes(pastExpirationDate.getMinutes() - 10); // 10 minutes ago
      easyPix.pendingPayments = [
        {
          id: "123",
          originalId: "mocked_original_id",
          expirationDate: pastExpirationDate,
          metadata: { somedata: 0 },
          value: 100,
          netValue: 98,
        },
      ];
    
      const mockDueFunction = jest.fn();
      easyPix.onDue(mockDueFunction);
    
      await easyPix.overdue("123", "mocked_original_id")();
    
      expect(mockDueFunction).toHaveBeenCalledWith("123", { somedata: 0 });
    
      jest.runOnlyPendingTimers();
    });

    test("#overdue method handles confirmed payment correctly", async () => {
      jest.spyOn(AsaasProvider.prototype, 'getPixPaymentStatusByPaymentId').mockResolvedValue("CONFIRMED");
    
      const easyPix = new EasyPix({ apiKey: "valid_api_key" });
      await easyPix.quit();
    
      const pastExpirationDate = new Date();
      pastExpirationDate.setMinutes(pastExpirationDate.getMinutes() - 10); // 10 minutes ago
      easyPix.pendingPayments = [
        {
          id: "123",
          originalId: "mocked_original_id",
          expirationDate: pastExpirationDate,
          metadata: {},
          value: 100,
          netValue: 98,
        },
      ];
    
      const mockPaidFunction = jest.fn();
      easyPix.onPaid(mockPaidFunction);
    
      await easyPix.overdue("123", "mocked_original_id")();
    
      expect(mockPaidFunction).toHaveBeenCalledWith("123", {});
    
      jest.runOnlyPendingTimers();
    });
  });

  describe("Default behavior", () => {
    beforeEach(() => {
      fs.writeFileSync(path.join("./", "config.json"), JSON.stringify([]));
    });

    test("#init method loads pending payments from config file", async () => {
      const fsMock = require("fs");
      const pathMock = require("path");
      const scheduleMock = require("node-schedule");
      const date = new Date();

      jest.spyOn(fsMock, "readFileSync").mockReturnValue(
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

      jest
        .spyOn(scheduleMock, "scheduleJob")
        .mockImplementation((id, date, callback) => callback());

      const easyPix = new EasyPix("valid_api_key");

      expect(fsMock.readFileSync).toHaveBeenCalledWith(
        pathMock.join("./", "config.json")
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
      AsaasProvider.prototype.getPixPaymentStatusByPaymentId.mockResolvedValueOnce("CONFIRMED");

      const fsMock = require("fs");
      const pathMock = require("path");

      const easyPix = new EasyPix("valid_api_key");
      await easyPix.quit();

      jest.spyOn(fsMock, "writeFileSync");

      const date = new Date().toISOString();

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

      expect(AsaasProvider.prototype.getPixPaymentStatusByPaymentId).toHaveBeenCalledWith(
        "mocked_original_id_1"
      );

      expect(paidMockFunction).toHaveBeenCalledWith("123", {});
      expect(fsMock.writeFileSync).toHaveBeenCalledWith(
        pathMock.join("./", "config.json"),
        JSON.stringify([])
      );
    });
  });
});
