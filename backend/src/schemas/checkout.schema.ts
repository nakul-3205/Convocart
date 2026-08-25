import { z } from 'zod';

export const DeliveryDetails = z.object({
  customerName: z.string().min(1).max(100),
  phone: z.string().min(10).max(15),
  email: z.string().email().max(150), // new
  address: z.string().min(1).max(300),
  pincode: z.string().min(4).max(10),
  deliveryNotes: z.string().max(300).optional(),
});