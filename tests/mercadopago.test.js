const {
  MercadopagoProvider,
} = require("../dist/providers/MercadopagoProvider");

jest.mock('mercadopago', () => ({
  Payment: jest.fn().mockImplementation(() => ({
    create: jest.fn().mockResolvedValue({
      point_of_interaction: {
        transaction_data: {
          qr_code_base64: 'mocked_base64_image',
          qr_code: 'mocked_qr_code',
        },
      },
      date_of_expiration: 'mocked_expiration_date',
      id: 123456, // Mocked ID
      transaction_amount: 100, // Mocked transaction amount
      taxes_amount: 5, // Mocked taxes amount
    }),
    get: jest.fn().mockResolvedValue({
      status: 'approved', // Mocked payment status
    }),
    cancel: jest.fn().mockResolvedValue(true),
  })),
  MercadoPagoConfig: jest.fn(),
}));

describe("MercadopagoProvider ", () => {
  test("Constructor throws error when MercadopagoProvider is missing and theres not arguments", () => {
    expect(() => new MercadopagoProvider()).toThrow(
      "Cannot read properties of undefined (reading 'API_KEY')"
    );
  });

  test("Constructor throws error when MercadopagoProvider is missing", () => {
    expect(() => new MercadopagoProvider({})).toThrow("Missing api key");
  });

  test("Constructor creates instance with valid MercadopagoProvider", () => {
    const mercadopagoProvider = new MercadopagoProvider({
      API_KEY: "pretend_this_is_a_key",
    });
    expect(mercadopagoProvider).toBeInstanceOf(MercadopagoProvider);
    expect(mercadopagoProvider.MERCADOPAGO_KEY).toBe("pretend_this_is_a_key");
  });

  test('createPixPayment method retrieves the expected data', async () => {
    const mercadopagoProvider = new MercadopagoProvider({
      API_KEY: 'pretend_this_is_a_key',
    });

    const result = await mercadopagoProvider.createPixPayment({
      id: '123',
      name: 'John Doe',
      taxId: '123456789',
      value: 100,
      description: 'Test Pix',
    });

    expect(result).toEqual({
      encodedImage: 'mocked_base64_image',
      payload: 'mocked_qr_code',
      expirationDate: 'mocked_expiration_date',
      originalId: '123456',
      value: 100,
      netValue: 95,
    });
  });

  test('getPixPaymentStatusByPaymentId method retrieves the expected status', async () => {
    const mercadopagoProvider = new MercadopagoProvider({
      API_KEY: 'pretend_this_is_a_key',
    });

    const status = await mercadopagoProvider.getPixPaymentStatusByPaymentId('mocked_payment_id');

    expect(status).toBe('CONFIRMED'); // Adjust based on your status mapping
  });

  test('deletePixChargeByPaymentId method cancels the payment', async () => {
    const mercadopagoProvider = new MercadopagoProvider({
      API_KEY: 'pretend_this_is_a_key',
    });

    const result = await mercadopagoProvider.deletePixChargeByPaymentId('mocked_payment_id');

    expect(result).toBe(true);
  });

  test("transfer method initiates a transfer", async () => {
    const mercadopago = new MercadopagoProvider({
      API_KEY: "valid_asaas_key",
    });

    expect(mercadopago.createPixTransfer()).rejects.toThrow(
      /Unexpected Error creating transfer by pix - Method not implemented by the gateway/
    );
  });
});
