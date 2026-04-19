import Joi from 'joi';

export const parentRegisterSchema = Joi.object({
  fullName: Joi.string().trim().min(2).required(),
  email: Joi.string().email().lowercase().required(),
  phoneNumber: Joi.string().trim().min(7).required(),
  password: Joi.string().min(8).required(),
  confirmPassword: Joi.any()
    .valid(Joi.ref('password'))
    .required()
    .messages({ 'any.only': 'Passwords do not match' }),
});

export const parentLoginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

export const parentRequestOtpSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const parentVerifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otpCode: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({ 'string.pattern.base': 'OTP must be a 6-digit number' }),
  newPassword: Joi.string().min(8).required(),
  confirmPassword: Joi.any()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({ 'any.only': 'Passwords do not match' }),
});
