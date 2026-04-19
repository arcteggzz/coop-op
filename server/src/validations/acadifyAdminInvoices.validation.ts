import Joi from 'joi';

const invoiceItemSchema = Joi.object({
  feeTypeId: Joi.string().uuid().required(),
  quantity: Joi.number().integer().positive().required(),
  unitPrice: Joi.number().positive().required(),
});

export const generateInvoiceSchema = Joi.object({
  studentId: Joi.string().required(),
  items: Joi.array().items(invoiceItemSchema).min(1).required(),
  remarks: Joi.string().max(500).optional(),
});
