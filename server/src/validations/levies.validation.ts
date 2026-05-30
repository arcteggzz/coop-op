import Joi from 'joi';

export const createLevySchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(2000).optional().allow('', null),
  defaultAmount: Joi.number().positive().required(),
  levyAccountNumber: Joi.string().min(1).max(50).required(),
  dueDate: Joi.string().isoDate().required(),
});

export const updateLevySchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  description: Joi.string().max(2000).optional().allow('', null),
  defaultAmount: Joi.number().positive().optional(),
  levyAccountNumber: Joi.string().min(1).max(50).optional(),
  dueDate: Joi.string().isoDate().optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

export const assignLevySchema = Joi.object({
  assignTo: Joi.string().valid('all', 'specific').required(),
  memberIds: Joi.when('assignTo', {
    is: 'specific',
    then: Joi.array().items(Joi.string().uuid()).min(1).required(),
    otherwise: Joi.array().items(Joi.string().uuid()).optional(),
  }),
  amountOverrides: Joi.array()
    .items(
      Joi.object({
        memberId: Joi.string().uuid().required(),
        amount: Joi.number().positive().required(),
      }),
    )
    .optional(),
});

export const recordLevyPaymentSchema = Joi.object({
  paidAmount: Joi.number().positive().required(),
  notes: Joi.string().max(2000).optional().allow('', null),
});

export const waiveLevyAssignmentSchema = Joi.object({
  notes: Joi.string().max(2000).optional().allow('', null),
});
