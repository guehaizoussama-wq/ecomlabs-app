import { z } from "zod";

export const orderItemSchema = z.object({
  productId: z.string().uuid().optional(),
  productName: z.string().min(2),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative()
});

export const orderSchema = z.object({
  customerId: z.string().uuid().optional(),
  customerName: z.string().min(2),
  phone: z.string().min(8),
  wilayaId: z.string().uuid(),
  communeId: z.string().uuid(),
  addressLine1: z.string().min(3),
  items: z.array(orderItemSchema).min(1),
  notes: z.string().optional(),
  status: z.enum(["pending", "confirmed", "no_answer", "cancelled", "shipped", "delivered", "returned"])
});
