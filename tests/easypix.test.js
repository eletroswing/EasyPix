const EasyPix = require("./../dist/index.js");
const AssasRequests = require("./../dist/asaas/index.js");
const axios = require("axios");
const fs = require("node:fs");
const path = require("node:path");

jest.useFakeTimers();

jest.mock("./../dist/asaas/index.js");
jest.mock("axios");

beforeEach(() => {
  fs.writeFileSync(path.join("./", "config.json"), JSON.stringify([]));
});

describe("Easy Pix", () => {describe("Asaas default", () => {
  test("Constructor throws error when API key is missing", () => {
    expect(() => new EasyPix()).toThrow(
      "Missing Asaas api key. Take a look on https://docs.asaas.com/docs/autenticacao and get yours."
    );
  });

  test("Constructor creates instance with valid API key, and be type of asaas", async () => {
    const easyPix = new EasyPix("valid_api_key");
    expect(easyPix).toBeInstanceOf(EasyPix);
    expect(easyPix.provider).toBe("ASAAS");
    expect(easyPix.apiInterface).toBeInstanceOf(AssasRequests);
    expect(easyPix.configPath).toBe("./");
    expect(easyPix.loopSecondsDelay).toBe(60);
    expect(easyPix.apiKey).toBe("valid_api_key");

    await easyPix.quit();
    jest.runOnlyPendingTimers();
  });

  test("Create method generates Pix and adds to pending payments", async () => {
    AssasRequests.prototype.generatePix.mockResolvedValue({
      encodedImage: "mocked_encoded_image",
      payload: "mocked_payload",
      expirationDate: new Date(),
      originalId: "mocked_original_id",
      value: 100,
      netValue: 98,
    });

    const easyPix = new EasyPix("valid_api_key");

    easyPix.pendingPayments = [];

    const result = await easyPix.create(
      "123",
      "John Doe",
      "123456789",
      100,
      "Test Pix"
    );

    await easyPix.quit();

    expect(AssasRequests.prototype.generatePix).toHaveBeenCalledWith({
      cpfCnpj: "123456789",
      description: "Test Pix",
      id: "123",
      name: "John Doe",
      value: 100,
    });

    expect(result).toEqual({
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
    AssasRequests.prototype.delPixCob.mockResolvedValue({
      deleted: true,
    });

    const easyPix = new EasyPix("valid_api_key");

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

    await easyPix.quit();

    expect(easyPix.pendingPayments).toEqual([]);
    expect(AssasRequests.prototype.delPixCob).toHaveBeenCalledWith(
      "mocked_original_id"
    );

    jest.runOnlyPendingTimers();
  });

  test("Transfer method calls AssasRequests.transfer", async () => {
    AssasRequests.prototype.transfer.mockResolvedValue({
      authorized: true,
      transferFee: 2,
      netValue: 98,
      value: 100,
    });

    const easyPix = new EasyPix("valid_api_key");
    const result = await easyPix.transfer(
      100,
      "john@example.com",
      "EMAIL",
      "Transfer description"
    );

    expect(AssasRequests.prototype.transfer).toHaveBeenCalledWith(
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
    AssasRequests.prototype.getPixStatus.mockResolvedValue("OVERDUE");

    const easyPix = new EasyPix("valid_api_key");
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

    await easyPix.quit();
    jest.runOnlyPendingTimers();
  });

  test("OnPaid callback is called when payment is confirmed", async () => {
    AssasRequests.prototype.getPixStatus.mockResolvedValue("CONFIRMED");

    const easyPix = new EasyPix("valid_api_key");
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
    AssasRequests.prototype.getPixStatus.mockResolvedValue("OVERDUE");
    AssasRequests.prototype.delPixCob.mockResolvedValue({ deleted: true });

    const easyPix = new EasyPix("valid_api_key");
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

    expect(AssasRequests.prototype.delPixCob).toHaveBeenCalledWith(
      "mocked_original_id"
    );

    expect(mockDueFunction).toHaveBeenCalledWith("123", { somedata: 0 });

    jest.runOnlyPendingTimers();
  });

  test("#overdue method handles confirmed payment correctly", async () => {
    AssasRequests.prototype.getPixStatus.mockResolvedValue("CONFIRMED");

    const easyPix = new EasyPix("valid_api_key");
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

    const easyPix = new EasyPix("valid_api_key", 60, true, "./");

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
    AssasRequests.prototype.getPixStatus.mockResolvedValueOnce("CONFIRMED");

    const fsMock = require("fs");
    const pathMock = require("path");

    const easyPix = new EasyPix("valid_api_key", 60, true, "./");
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

    expect(AssasRequests.prototype.getPixStatus).toHaveBeenCalledWith(
      "mocked_original_id_1"
    );

    expect(paidMockFunction).toHaveBeenCalledWith("123", {});
    expect(fsMock.writeFileSync).toHaveBeenCalledWith(
      pathMock.join("./", "config.json"),
      JSON.stringify([])
    );
  });

});
})