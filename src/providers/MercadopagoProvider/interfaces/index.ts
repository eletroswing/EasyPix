export interface ICreatePixPaymentPayload {
  taxId: string;
  description: string;
  value: number;
  name: string;
  payment_method_id: string;
  date_of_expiration: Date;
  external_reference: string;
}