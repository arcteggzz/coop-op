import Joi from 'joi';
import { ADMIN_PERMISSION_KEYS } from '../constants/adminPermissions';

export const inviteAdminSchema = Joi.object({
  fullName: Joi.string().min(1).max(255).required(),
  email: Joi.string().email().required(),
  role: Joi.string().valid('SuperAdmin', 'Admin').required(),
  permissions: Joi.when('role', {
    is: 'Admin',
    then: Joi.array()
      .items(Joi.string().valid(...ADMIN_PERMISSION_KEYS))
      .min(1)
      .required(),
    otherwise: Joi.array().items(Joi.string()).optional(),
  }),
});

export const updatePermissionsSchema = Joi.object({
  permissions: Joi.array()
    .items(Joi.string().valid(...ADMIN_PERMISSION_KEYS))
    .min(1)
    .required(),
});
