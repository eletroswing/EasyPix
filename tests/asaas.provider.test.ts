import { AsaasProvider } from './../src/providers/index';
import HttpClient from '../src/clients/HttpClient';
import { PIX_ADDRESS_KEY_TYPE, ICreatePixTransferPayload, OPERATION_TYPE } from '../src/shared/interfaces';

jest.mock('../src/clients/HttpClient');

const mockedHttpClient = HttpClient as jest.Mocked<typeof HttpClient>;

describe('AsaasProvider', () => {
  test('Constructor throws error when API KEY is missing', () => {
    expect(() => new AsaasProvider({})).toThrow('[ASAAS] - Missing API KEY');
  });

  test('Constructor creates instance with valid API KEY and is a instance of AsaasProvider', () => {
    const asaasProvider = new AsaasProvider({API_KEY: 'pretend_this_is_a_key'});
    expect(asaasProvider).toBeInstanceOf(AsaasProvider);
  });

  test('createPixPayment method creates a customer, a Pix payment, and retrieves QR code', async () => {
    const asaasProvider = new AsaasProvider({API_KEY: 'pretend_this_is_a_key'});

    mockedHttpClient.post.mockResolvedValueOnce({
      statusCode: 200,
      body: { id: 'customer_id' },
    });
    mockedHttpClient.post.mockResolvedValueOnce({
      statusCode: 200,
      body: { id: 'pix_payment_id', value: 100, netValue: 98 },
    });
    mockedHttpClient.get.mockResolvedValueOnce({
      statusCode: 200,
      body: { encodedImage: 'mocked_encoded_image', payload: 'mocked_payload', expirationDate: new Date() },
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

    expect(mockedHttpClient.post).toHaveBeenCalledWith(expect.stringContaining('/customers'), expect.any(Object), expect.any(Object));
    expect(mockedHttpClient.post).toHaveBeenCalledWith(expect.stringContaining('/payments'), expect.any(Object), expect.any(Object));
    expect(mockedHttpClient.get).toHaveBeenCalledWith(expect.stringContaining('/payments/pix_payment_id/pixQrCode'), expect.any(Object));
  });

  test("createPixPayment method creates a customer, a Pix payment, and retrieves QR code, error creating customer", async () => {
    const asaasProvider = new AsaasProvider({API_KEY: 'pretend_this_is_a_key'});

    mockedHttpClient.post.mockResolvedValueOnce({
      statusCode: 400,
      body: { id: "customer_id" },
    });

    await expect(
      asaasProvider.createPixPayment({
        id: "123",
        name: "John Doe",
        taxId: "123456789",
        value: 100,
        description: "Test Pix",
      })
    ).rejects.toThrow(
      /Unexpected Error creating the pix payment - Cannot destructure property 'body'/
    );
  });

  test('createPixPayment method creates a customer, a Pix payment, and retrieves QR code, error creating pix', async () => {
    const asaasProvider = new AsaasProvider({API_KEY: 'pretend_this_is_a_key'});
  
    mockedHttpClient.post.mockResolvedValueOnce({
      statusCode: 200,
      body: { id: 'customer_id' },
    });

    mockedHttpClient.post.mockResolvedValueOnce({
      statusCode: 400,
      body: { id: 'pix_payment_id', value: 100, netValue: 98 },
    });

    await expect(
      asaasProvider.createPixPayment({
        id: "123",
        name: "John Doe",
        taxId: "123456789",
        value: 100,
        description: "Test Pix",
      })
    ).rejects.toThrow(
      /Unexpected Error looking for the qr code - Cannot destructure property 'body'/
    );
  })

  test('getPixPaymentStatusByPaymentId method retrieves Pix payment status: 200 ok', async () => {
    const asaasProvider = new AsaasProvider({API_KEY: 'pretend_this_is_a_key'});

    mockedHttpClient.get.mockResolvedValueOnce({
      statusCode: 200,
      body: { status: 'CONFIRMED' },
    });

    const result = await asaasProvider.getPixPaymentStatusByPaymentId('pix_payment_id');

    expect(result).toBe('CONFIRMED');
    expect(mockedHttpClient.get).toHaveBeenCalledWith(expect.stringContaining('/payments/pix_payment_id/status'), expect.any(Object));
  });

  test('deletePixChargeByPaymentId method deletes Pix payment: delete true', async () => {
    const asaasProvider = new AsaasProvider({API_KEY: 'pretend_this_is_a_key'});
    
    mockedHttpClient.delete.mockResolvedValueOnce({
      statusCode: 200,
      body: { id: 'pix_payment_id', deleted: true },
    });

    const result = await asaasProvider.deletePixChargeByPaymentId('pix_payment_id');

    expect(result).toBe(true);
    expect(mockedHttpClient.delete).toHaveBeenCalledWith(expect.stringContaining('/payments/pix_payment_id'), expect.any(Object));
  });

  
  test('deletePixChargeByPaymentId method deletes Pix payment: delete false', async () => {
    const asaasProvider = new AsaasProvider({API_KEY: 'pretend_this_is_a_key'});

    mockedHttpClient.delete.mockResolvedValueOnce({
      statusCode: 200,
      body: { id: 'pix_payment_id', deleted: false },
    });

    const result = await asaasProvider.deletePixChargeByPaymentId('pix_payment_id');

    expect(result).toBe(false);
    expect(mockedHttpClient.delete).toHaveBeenCalledWith(expect.stringContaining('/payments/pix_payment_id'), expect.any(Object));
  });

  test('transfer method initiates a transfer', async () => {
    const asaasProvider = new AsaasProvider({API_KEY: 'pretend_this_is_a_key'});
    
    mockedHttpClient.post.mockResolvedValueOnce({
      statusCode: 200,
      body: { authorized: true, transferFee: 2, netValue: 98, value: 100 },
    });

    const body: ICreatePixTransferPayload = {
      value: 100, 
      pixAddressKey: 'john@example.com', 
      pixAddressKeyType: PIX_ADDRESS_KEY_TYPE.EMAIL, 
      description: 'Transfer description',
      operationType: OPERATION_TYPE.PIX
    };

    const result = await asaasProvider.createPixTransfer(body);

    expect(result).toEqual({ authorized: true, transferFee: 2, netValue: 98, value: 100 });
    expect(mockedHttpClient.post).toHaveBeenCalledWith(expect.stringContaining('/transfers'), expect.any(Object), expect.any(Object));
  });
});