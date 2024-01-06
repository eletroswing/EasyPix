const {AsaasProvider} = require('../dist/providers/AsaasProvider');
const HttpClient = require('../dist/clients/HttpClient');

const axios = require('axios');
jest.mock('axios');
jest.mock('../dist/clients/HttpClient', () => ({
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

describe('AssasRequests.default', () => {
  test('Constructor throws error when ASAAS_KEY is missing and theres not arguments', () => {
    expect(() => new AsaasProvider()).toThrow("Cannot read properties of undefined (reading 'API_KEY')");
  });

  test('Constructor throws error when ASAAS_KEY is missing', () => {
    expect(() => new AsaasProvider({})).toThrow('Missing api key');
  });

  test('Constructor creates instance with valid ASAAS_KEY and default ASAAS_BASE_URL', () => {
    const assasRequests = new AsaasProvider({API_KEY: 'pretend_this_is_a_key'});
    expect(assasRequests).toBeInstanceOf(AsaasProvider);
    expect(assasRequests.ASAAS_KEY).toBe('pretend_this_is_a_key');
    expect(assasRequests.ASAAS_BASE_URL).toBe('https://sandbox.asaas.com/api/v3');
  });

  test('generatePix method creates a customer, a Pix payment, and retrieves QR code', async () => {
    HttpClient.post.mockResolvedValueOnce({
      statusCode: 200,
      body: { id: 'customer_id' },
    });
  
    HttpClient.post.mockResolvedValueOnce({
      statusCode: 200,
      body: { id: 'pix_payment_id', value: 100, netValue: 98 },
    });
  
    HttpClient.get.mockResolvedValueOnce({
      statusCode: 200,
      body: { encodedImage: 'mocked_encoded_image', payload: 'mocked_payload', expirationDate: new Date() },
    });
  
    const asaasProvider = new AsaasProvider({
      API_KEY: 'valid_asaas_key',
      httpClient: HttpClient,
    });
  
    const result = await asaasProvider.createPixPayment({
      id: '123',
      name: 'John Doe',
      taxId: '123456789',
      value: 100,
      description: 'Test Pix',
    });
  
    expect(result).toEqual({
      encodedImage: 'mocked_encoded_image',
      payload: 'mocked_payload',
      expirationDate: expect.any(Date),
      originalId: 'pix_payment_id',
      value: 100,
      netValue: 98,
    });
  
    expect(HttpClient.post).toHaveBeenCalledWith(
      expect.stringContaining('/customers'),
      { name: 'John Doe', cpfCnpj: '123456789' },
      expect.objectContaining({
        headers: { access_token: 'valid_asaas_key' },
      })
    );
  
    expect(HttpClient.post).toHaveBeenCalledWith(
      expect.stringContaining('/payments'),
      expect.objectContaining({
        value: 100,
        description: 'Test Pix',
        billingType: 'PIX',
        postalService: false,
        externalReference: '123',
        customer: 'customer_id',
      }),
      expect.objectContaining({
        headers: { access_token: 'valid_asaas_key' },
      })
    );
  
    expect(HttpClient.get).toHaveBeenCalledWith(
      expect.stringContaining('/payments/pix_payment_id/pixQrCode'),
      expect.objectContaining({
        headers: { access_token: 'valid_asaas_key' },
      })
    );
  });

  test("generatePix method creates a customer, a Pix payment, and retrieves QR code, error creating customer", async () => {
    HttpClient.post.mockResolvedValueOnce({
      status: 400,
      body: { id: "customer_id" },
    });
  
    const asaasProvider = new AsaasProvider({API_KEY: "valid_asaas_key", httpClient: HttpClient});

    await expect(
      asaasProvider.createPixPayment({
        id: "123",
        name: "John Doe",
        cpfCnpj: "123456789",
        value: 100,
        description: "test.skip Pix",
      })
    ).rejects.toThrow(
      /Unexpected Error creating the pix payment - /
    );
  });

  test('generatePix method creates a customer, a Pix payment, and retrieves QR code, error creating pix', async () => {
    HttpClient.post.mockResolvedValueOnce({
      statusCode: 200,
      body: { id: 'customer_id' },
    });
  
    HttpClient.post.mockResolvedValueOnce({
      statusCode: 400,
      body: { id: 'pix_payment_id', value: 100, netValue: 98 },
    });
  
    const asaasProvider = new AsaasProvider({API_KEY: "valid_asaas_key", httpClient: HttpClient});
  
    await expect(
      asaasProvider.createPixPayment({
        id: '123',
        name: 'John Doe',
        cpfCnpj: '123456789',
        value: 100,
        description: 'Test Pix',
      })
    ).rejects.toThrow(
      /Unexpected Error looking for the qr code - /
    );
  })

  test('getPixStatus method retrieves Pix payment statusCode: 200 ok', async () => {
    const asaasProvider = new AsaasProvider({API_KEY: "valid_asaas_key", httpClient: HttpClient});
  
    HttpClient.get.mockResolvedValueOnce({
      statusCode: 200,
      body: { status: 'CONFIRMED' },
    });

    const result = await asaasProvider.getPixPaymentStatusByPaymentId('pix_payment_id');

    expect(result).toBe('CONFIRMED');
    expect(HttpClient.get).toHaveBeenCalledWith(expect.stringContaining('/payments/pix_payment_id/status'), expect.any(Object));
  });

  test('deletePixChargeByPaymentId method deletes Pix payment: delete true', async () => {
    const asaasProvider = new AsaasProvider({API_KEY: "valid_asaas_key", httpClient: HttpClient});

    HttpClient.delete.mockResolvedValueOnce({
      statusCode: 200,
      body: { id: 'pix_payment_id', deleted: true },
    });

    const result = await asaasProvider.deletePixChargeByPaymentId('pix_payment_id');

    expect(result).toBe(true);
    expect(HttpClient.delete).toHaveBeenCalledWith(expect.stringContaining('/payments/pix_payment_id'), expect.any(Object));
  });

  test('deletePixChargeByPaymentId method deletes Pix payment: delete false', async () => {
    const asaasProvider = new AsaasProvider({API_KEY: "valid_asaas_key", httpClient: HttpClient});

    HttpClient.delete.mockResolvedValueOnce({
      statusCode: 200,
      body: { id: 'pix_payment_id', deleted: false },
    });

    const result = await asaasProvider.deletePixChargeByPaymentId('pix_payment_id');

    expect(result).toBe(false);
    expect(HttpClient.delete).toHaveBeenCalledWith(expect.stringContaining('/payments/pix_payment_id'), expect.any(Object));
  });

  test('transfer method initiates a transfer', async () => {
    const asaasProvider = new AsaasProvider({API_KEY: "valid_asaas_key", httpClient: HttpClient});
    
    HttpClient.post.mockResolvedValueOnce({
      statusCode: 200,
      body: { authorized: true, transferFee: 2, netValue: 98, value: 100 },
    });

    const result = await asaasProvider.createPixTransfer(100, 'john@example.com', 'EMAIL', 'Transfer description');

    expect(result).toEqual({ authorized: true, transferFee: 2, netValue: 98, value: 100 });
    expect(HttpClient.post).toHaveBeenCalledWith(expect.stringContaining('/transfers'), expect.any(Object), expect.any(Object));
  });
});