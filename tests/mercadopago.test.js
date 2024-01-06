const MercadopagoRequest = require('../dist/mercado-pago/index.js');
const axios = require('axios');
jest.mock('axios');

describe('MercadopagoRequest.default', () => {
  test('Constructor throws error when MP_KEY is missing', () => {
    expect(() => new MercadopagoRequest).toThrow('Missing mercado-pago api key');
  });

  test('Constructor creates instance with valid MP_KEY and default MP_BASE_URL', () => {
    const mercadopagoRequest = new MercadopagoRequest('pretend_this_is_a_key');
    expect(mercadopagoRequest).toBeInstanceOf(MercadopagoRequest);
    expect(mercadopagoRequest._MP_KEY).toBe('pretend_this_is_a_key');
    expect(mercadopagoRequest._MP_BASE_URL).toBe('https://api.mercadopago.com/v1');
  });

  test('generatePix method creates a Pix', async () => {
    const mercadopagoRequest = new MercadopagoRequest('valid_asaas_key'); 
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: { id: 'pix_payment_id', point_of_interaction: {transaction_data: {qr_code: 'mocked_payload', qr_code_base64: 'mocked_encoded_image'}}},
    });

    const result = await mercadopagoRequest.generatePix({
      id: '123',
      name: 'John Doe',
      cpfCnpj: '123456789',
      value: 100,
      description: 'Test.skip Pix',
    });

    expect(result).toEqual({
      encodedImage: 'mocked_encoded_image',
      payload: 'mocked_payload',
      expirationDate: expect.any(Date),
      originalId: 'pix_payment_id',
      value: 100,
      netValue: 100,
    });

    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/payments'), expect.any(Object), expect.any(Object));
  });

  test("generatePix method creates a customer, a Pix payment, and retrieves QR code, error creating the pix", async () => {
    const mercadopago = new MercadopagoRequest("valid_asaas_key");
    axios.post.mockResolvedValueOnce({
      status: 400,
      data: { id: "customer_id" },
    });

    await expect(
      mercadopago.generatePix({
        id: "123",
        name: "John Doe",
        cpfCnpj: "123456789",
        value: 100,
        description: "Test.skip Pix",
      })
    ).rejects.toThrow(
      /Error creating the pix, expected status code 200 or 201, received status 400 and body/
    );
  });


  test('getPixStatus method retrieves Pix payment status: 200 ok', async () => {
    const mercadopago = new MercadopagoRequest('valid_asaas_key');
    axios.get.mockResolvedValueOnce({
      status: 200,
      data: { status: 'PENDING' },
    });

    const result = await mercadopago.getPixStatus('pix_payment_id');

    expect(result).toBe('PENDING');
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining(`/payments/pix_payment_id`), expect.any(Object));
  });

  test('getPixStatus method retrieves Pix payment status: 400 error', async () => {
    const mercadopago = new MercadopagoRequest('valid_asaas_key');
    axios.get.mockResolvedValueOnce({
      status: 400,
      data: { status: 'PENDING' },
    });
  
    await expect(mercadopago.getPixStatus('pix_payment_id')).rejects.toThrow(/Error getting the status, expected status code 200, received status 400 and body/);
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/payments/pix_payment_id'), expect.any(Object));
  });  

  test('delPixCob method deletes Pix payment: delete true', async () => {
    const mercadopago = new MercadopagoRequest('valid_asaas_key');
    axios.put.mockResolvedValueOnce({
      status: 200
    });

    const result = await mercadopago.delPixCob('pix_payment_id');

    expect(result).toBe(true);
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/payments/pix_payment_id'), expect.any(Object), expect.any(Object));
  });

  test('transfer method initiates a transfer', async () => {
    const mercadopago = new MercadopagoRequest('valid_asaas_key');
    await expect(mercadopago.transfer()).rejects.toThrow('Not implemented by the gatway'); 
  });
});