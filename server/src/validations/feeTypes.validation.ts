import Joi from "joi";

export const createFeeTypeSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(255).optional().allow("", null),
  priorityLevel: Joi.number().integer().min(1).max(255).required(),
  accountNumber: Joi.string().alphanum().max(20).optional().allow(null),
});

export const updateFeeTypeSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(255).optional().allow("", null),
  priorityLevel: Joi.number().integer().min(1).max(255).optional(),
  accountNumber: Joi.string().alphanum().max(20).optional().allow(null),
}).min(1);
