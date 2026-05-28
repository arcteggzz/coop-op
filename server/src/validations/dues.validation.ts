import Joi from 'joi';

export const createDueScheduleSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(2000).optional().allow('', null),
  amount: Joi.number().positive().required(),
  frequency: Joi.string()
    .valid('Monthly', 'Quarterly', 'Biannual', 'Annual', 'OneTime')
    .required(),
  startDate: Joi.string().isoDate().required(),
  endDate: Joi.string().isoDate().optional().allow('', null),
  dueAccountNumber: Joi.string().min(1).max(50).required(),
});

export const updateDueScheduleSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  description: Joi.string().max(2000).optional().allow('', null),
  amount: Joi.number().positive().optional(),
  frequency: Joi.string()
    .valid('Monthly', 'Quarterly', 'Biannual', 'Annual', 'OneTime')
    .optional(),
  startDate: Joi.string().isoDate().optional(),
  endDate: Joi.string().isoDate().optional().allow('', null),
  dueAccountNumber: Joi.string().min(1).max(50).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

export const issueDuesSchema = Joi.object({
  periodLabel: Joi.string().min(1).max(50).required(),
  dueDate: Joi.string().isoDate().required(),
  amount: Joi.number().positive().optional(),
});

export const recordPaymentSchema = Joi.object({
  paidAmount: Joi.number().positive().required(),
  notes: Joi.string().max(2000).optional().allow('', null),
});

export const waivePaymentSchema = Joi.object({
  notes: Joi.string().max(2000).optional().allow('', null),
});
