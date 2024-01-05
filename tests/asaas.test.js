const AssasRequests = require('../dist/asaas/index.js');
const axios = require('axios');
jest.mock('axios');

describe('AssasRequests.default', () => {
  test('Constructor throws error when ASAAS_KEY is missing', () => {
    expect(() => new AssasRequests).toThrow('Missing asaas api key');
  });

  test('Constructor creates instance with valid ASAAS_KEY and default ASAAS_BASE_URL', () => {
    const assasRequests = new AssasRequests('pretend_this_is_a_key');
    expect(assasRequests).toBeInstanceOf(AssasRequests);
    expect(assasRequests._ASAAS_KEY).toBe('pretend_this_is_a_key');
    expect(assasRequests._ASAAS_BASE_URL).toBe('https://sandbox.asaas.com/api/v3');
  });

  test('generatePix method creates a customer, a Pix payment, and retrieves QR code', async () => {
    const assasRequests = new AssasRequests('valid_asaas_key'); 
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: { id: 'customer_id' },
    });
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: { id: 'pix_payment_id', value: 100, netValue: 98 },
    });
    axios.get.mockResolvedValueOnce({
      status: 200,
      data: { encodedImage: 'mocked_encoded_image', payload: 'mocked_payload', expirationDate: new Date() },
    });

    const result = await assasRequests.generatePix({
      id: '123',
      name: 'John Doe',
      cpfCnpj: '123456789',
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

    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/customers'), expect.any(Object), expect.any(Object));
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/payments'), expect.any(Object), expect.any(Object));
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/payments/pix_payment_id/pixQrCode'), expect.any(Object));
  });

  test("generatePix method creates a customer, a Pix payment, and retrieves QR code, error creating customer", async () => {
    const assasRequests = new AssasRequests("valid_asaas_key");
    axios.post.mockResolvedValueOnce({
      status: 400,
      data: { id: "customer_id" },
    });

    await expect(
      assasRequests.generatePix({
        id: "123",
        name: "John Doe",
        cpfCnpj: "123456789",
        value: 100,
        description: "Test Pix",
      })
    ).rejects.toThrow(
      /Error creating the customer, expected and id and status code 200, received status 400 and body/
    );
  });

  test('generatePix method creates a customer, a Pix payment, and retrieves QR code, error creating pix', async () => {
    const assasRequests = new AssasRequests('valid_asaas_key'); 
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: { id: 'customer_id' },
    });
    axios.post.mockResolvedValueOnce({
      status: 400,
      data: { id: 'pix_payment_id', value: 100, netValue: 98 },
    });

    await expect(
      assasRequests.generatePix({
        id: "123",
        name: "John Doe",
        cpfCnpj: "123456789",
        value: 100,
        description: "Test Pix",
      })
    ).rejects.toThrow(
      /Error creating the pix, expected and id and status code 200, received status 400 and body/
    );
  })

  test('generatePix method creates a customer, a Pix payment, and retrieves QR code, error getting the qr', async () => {
    const assasRequests = new AssasRequests('valid_asaas_key'); 
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: { id: 'customer_id' },
    });
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: { id: 'pix_payment_id', value: 100, netValue: 98 },
    });
    axios.get.mockResolvedValueOnce({
      status: 400,
      data: { encodedImage: 'mocked_encoded_image', payload: 'mocked_payload', expirationDate: new Date() },
    });

    await expect(
      assasRequests.generatePix({
        id: "123",
        name: "John Doe",
        cpfCnpj: "123456789",
        value: 100,
        description: "Test Pix",
      })
    ).rejects.toThrow(
      /Error looking for the qr code, expected status code 200, received status 400 and body/
    );
  });

  test('getPixStatus method retrieves Pix payment status: 200 ok', async () => {
    const assasRequests = new AssasRequests('valid_asaas_key');
    axios.get.mockResolvedValueOnce({
      status: 200,
      data: { status: 'CONFIRMED' },
    });

    const result = await assasRequests.getPixStatus('pix_payment_id');

    expect(result).toBe('CONFIRMED');
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/payments/pix_payment_id/status'), expect.any(Object));
  });

  test('getPixStatus method retrieves Pix payment status: 400 error', async () => {
    const assasRequests = new AssasRequests('valid_asaas_key');
    axios.get.mockResolvedValueOnce({
      status: 400,
      data: { status: 'CONFIRMED' },
    });
  
    await expect(assasRequests.getPixStatus('pix_payment_id')).rejects.toThrow(/Error getting the status, expected status code 200, received status 400 and body/);
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/payments/pix_payment_id/status'), expect.any(Object));
  });  

  test('delPixCob method deletes Pix payment: delete true', async () => {
    const assasRequests = new AssasRequests('valid_asaas_key');
    axios.delete.mockResolvedValueOnce({
      status: 200,
      data: { id: 'pix_payment_id', deleted: true },
    });

    const result = await assasRequests.delPixCob('pix_payment_id');

    expect(result).toBe(true);
    expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/payments/pix_payment_id'), expect.any(Object));
  });

  test('delPixCob method deletes Pix payment: delete false', async () => {
    const assasRequests = new AssasRequests('valid_asaas_key');
    axios.delete.mockResolvedValueOnce({
      status: 200,
      data: { id: 'pix_payment_id', deleted: false },
    });

    const result = await assasRequests.delPixCob('pix_payment_id');

    expect(result).toBe(false);
    expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/payments/pix_payment_id'), expect.any(Object));
  });

  test('transfer method initiates a transfer', async () => {
    const assasRequests = new AssasRequests('valid_asaas_key');
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: { authorized: true, transferFee: 2, netValue: 98, value: 100 },
    });

    const result = await assasRequests.transfer(100, 'john@example.com', 'EMAIL', 'Transfer description');

    expect(result).toEqual({ authorized: true, transferFee: 2, netValue: 98, value: 100 });
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/transfers'), expect.any(Object), expect.any(Object));
  });
});