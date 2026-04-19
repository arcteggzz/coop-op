import Joi from 'joi';

const invoiceItemSchema = Joi.object({
  feeTypeId: Joi.string().uuid().required(),
  quantity: Joi.number().integer().positive().required(),
  unitPrice: Joi.number().positive().required(),
});

export const generateInvoiceSchema = Joi.object({
  studentId: Joi.string().uuid().required(),
  items: Joi.array().items(invoiceItemSchema).min(1).required(),
  remarks: Joi.string().min(1).optional(),
});

export const generateInvoiceByAccountNumberSchema = Joi.object({
  accountNumber: Joi.string().required(),
  items: Joi.array().items(invoiceItemSchema).min(1).required(),
  remarks: Joi.string().min(1).optional(),
});

export const sendInvoiceReminderSchema = Joi.object({
  invoiceId: Joi.string().uuid().required(),
});
