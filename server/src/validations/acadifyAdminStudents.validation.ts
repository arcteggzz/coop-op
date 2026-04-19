import Joi from 'joi';

export const createStudentSchema = Joi.object({
  schoolId: Joi.string().required(),
  parentEmail: Joi.string().email().required(),
  parentFullName: Joi.string().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  classId: Joi.string().uuid().required(),
  age: Joi.number().integer().min(1).max(100).required(),
});

const invoiceItemSchema = Joi.object({
  feeTypeId: Joi.string().uuid().required(),
  quantity: Joi.number().integer().positive().required(),
  unitPrice: Joi.number().positive().required(),
});

export const generateInvoiceSchema = Joi.object({
  items: Joi.array().items(invoiceItemSchema).min(1).required(),
  remarks: Joi.string().max(500).optional().allow(''),
});
