import Joi from 'joi';

export const createParentSchema = Joi.object({
  fullName: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
});

export const lockUnlockSchema = Joi.object({
  isLocked: Joi.boolean().required(),
  reason: Joi.string().min(3).max(500).required(),
});

export const archiveUnarchiveSchema = Joi.object({
  isActive: Joi.boolean().required(),
  reason: Joi.string().min(3).max(500).required(),
});
