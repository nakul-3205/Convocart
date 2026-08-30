import { describe, it, expect } from 'vitest';
import { DeliveryDetails } from '../schemas/checkout.schema';

describe('DeliveryDetails schema', () => {
  it('accepts a fully valid payload', () => {
    expect(DeliveryDetails.safeParse({
      customerName: 'Test User', phone: '9999999999', email: 'test@example.com', address: '123 Test St', pincode: '400001',
    }).success).toBe(true);
  });

  it('rejects an invalid email', () => {
    expect(DeliveryDetails.safeParse({
      customerName: 'Test', phone: '9999999999', email: 'not-an-email', address: 'X', pincode: '400001',
    }).success).toBe(false);
  });

  it('rejects a phone number that is too short', () => {
    expect(DeliveryDetails.safeParse({
      customerName: 'Test', phone: '123', email: 'test@example.com', address: 'X', pincode: '400001',
    }).success).toBe(false);
  });

  it('allows deliveryNotes to be omitted', () => {
    expect(DeliveryDetails.safeParse({
      customerName: 'Test', phone: '9999999999', email: 'test@example.com', address: 'X', pincode: '400001',
    }).success).toBe(true);
  });
});