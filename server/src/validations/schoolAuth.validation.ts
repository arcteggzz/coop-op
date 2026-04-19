import Joi from 'joi';

const VALID_SCHOOL_TYPES = ['Creche', 'Kindergarten', 'Primary', 'Secondary'];

export const schoolSignupSchema = Joi.object({
  schoolName: Joi.string().min(2).max(255).required(),
  schoolType: Joi.array()
    .items(Joi.string().valid(...VALID_SCHOOL_TYPES))
    .min(1)
    .required(),
  primaryEmail: Joi.string().email().required(),
  primaryPhoneNumber: Joi.string().min(7).max(20).required(),
  adminEmail: Joi.string().email().required(),
  adminPassword: Joi.string().min(8).required(),
  adminConfirmPassword: Joi.any()
    .valid(Joi.ref('adminPassword'))
    .required()
    .messages({ 'any.only': 'Passwords do not match' }),
  adminFullName: Joi.string().min(2).max(255).required(),
});

export const schoolLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const schoolRequestOtpSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const schoolVerifyOtpSchema = Joi.object({
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
