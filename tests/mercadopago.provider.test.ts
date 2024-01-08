import { MercadoPagoProvider } from '../src/providers/index';
import HttpClient from '../src/clients/HttpClient';
import { MethodNotImplemented } from '../src/shared/errors';
import { PROVIDERS } from '../src/shared/interfaces';

jest.mock('../src/clients/HttpClient');

const mockedHttpClient = HttpClient as jest.Mocked<typeof HttpClient>;

describe('MercadoPagoProvider', () => {
  test('Constructor throws error when API KEY is missing', () => {
    expect(() => new MercadoPagoProvider({})).toThrow('[MERCADO_PAGO] - Missing API KEY');
  });

  test('Constructor creates instance with valid API KEY and is a instance of MercadoPagoProvider', () => {
    const mercadopagoProvider = new MercadoPagoProvider({API_KEY: 'pretend_this_is_a_key'});
    expect(mercadopagoProvider).toBeInstanceOf(MercadoPagoProvider);
  });

  test('createPixPayment method creates a Pix payment, and retrieves QR code', async () => {
    const mercadopagoProvider = new MercadoPagoProvider({API_KEY: 'pretend_this_is_a_key'});

    mockedHttpClient.post.mockResolvedValueOnce({
      statusCode: 200,
      body: { id: 'pix_payment_id', taxes_amount: 0, point_of_interaction: {transaction_data: {qr_code_base64: 'mocked_encoded_image', qr_code: 'mocked_payload' }} },
    });
    
    const result = await mercadopagoProvider.createPixPayment({
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
      netValue: 100,
    });

    expect(mockedHttpClient.post).toHaveBeenCalledWith(expect.stringContaining('/payments'), expect.any(Object), expect.any(Object));
  });

  test('createPixPayment method creates a Pix payment, and retrieves QR code, error creating pix', async () => {
    const mercadopagoProvider = new MercadoPagoProvider({API_KEY: 'pretend_this_is_a_key'});

    mockedHttpClient.post.mockResolvedValueOnce({
      statusCode: 400,
      body: { },
    });
    
    await expect(mercadopagoProvider.createPixPayment({
      id: '123',
      name: 'John Doe',
      taxId: '123456789',
      value: 100,
      description: 'Test Pix',
    })).rejects.toThrow(
      /Unexpected Error creating the pix payment - Cannot read properties of undefined/
    );

    expect(mockedHttpClient.post).toHaveBeenCalledWith(expect.stringContaining('/payments'), expect.any(Object), expect.any(Object));
  })

  test('getPixPaymentStatusByPaymentId method retrieves Pix payment status: 200 ok', async () => {
    const mercadopagoProvider = new MercadoPagoProvider({API_KEY: 'pretend_this_is_a_key'});

    mockedHttpClient.get.mockResolvedValueOnce({
      statusCode: 200,
      body: { status: 'approved' },
    });

    const result = await mercadopagoProvider.getPixPaymentStatusByPaymentId('pix_payment_id');

    expect(result).toBe('CONFIRMED');
    expect(mockedHttpClient.get).toHaveBeenCalledWith(expect.stringContaining('/payments/pix_payment_id'), expect.any(Object));
  });

  test('deletePixChargeByPaymentId method deletes Pix payment: delete true', async () => {
    const mercadopagoProvider = new MercadoPagoProvider({API_KEY: 'pretend_this_is_a_key'});
    
    mockedHttpClient.put.mockResolvedValueOnce({
      statusCode: 200,
      body: { id: 'pix_payment_id', deleted: true },
    });

    const result = await mercadopagoProvider.deletePixChargeByPaymentId('pix_payment_id');

    expect(result).toBe(true);
    expect(mockedHttpClient.put).toHaveBeenCalledWith(expect.stringContaining('/payments/pix_payment_id'), expect.any(Object), expect.any(Object));
  });

  
  test('transfer method initiates a transfer', async () => {
    const mercadopagoProvider = new MercadoPagoProvider({API_KEY: 'pretend_this_is_a_key'});
    
    expect(() => mercadopagoProvider.createPixTransfer()).toThrow(
      new MethodNotImplemented(PROVIDERS.MERCADO_PAGO)
  );
  });
});