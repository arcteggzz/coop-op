import Joi from 'joi';
import { MANAGER_PERMISSION_KEYS } from '../constants/managerPermissions';

export const inviteManagerSchema = Joi.object({
  fullName: Joi.string().min(1).max(255).required(),
  email: Joi.string().email().required(),
  role: Joi.string().valid('SuperManager', 'Support').required(),
  permissions: Joi.when('role', {
    is: 'Support',
    then: Joi.array()
      .items(Joi.string().valid(...MANAGER_PERMISSION_KEYS))
      .min(1)
      .required(),
    otherwise: Joi.array().items(Joi.string()).optional(),
  }),
});

export const updateManagerPermissionsSchema = Joi.object({
  permissions: Joi.array()
    .items(Joi.string().valid(...MANAGER_PERMISSION_KEYS))
    .min(1)
    .required(),
});
