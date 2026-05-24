import Joi from 'joi';

export const inviteMemberSchema = Joi.object({
  firstName: Joi.string().min(1).max(255).required(),
  lastName: Joi.string().min(1).max(255).required(),
  email: Joi.string().email().required(),
});
