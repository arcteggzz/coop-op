import Joi from 'joi';

const locationSchema = Joi.object({
  fullAddress: Joi.string().min(5).max(500).required(),
  city:        Joi.string().min(2).max(100).required(),
  lga:         Joi.string().min(2).max(100).required(),
  state:       Joi.string().min(2).max(100).required(),
  country:     Joi.string().min(2).max(100).default('Nigeria'),
});

const gradeClassItemSchema = Joi.object({
  code:      Joi.string().min(1).max(20).required(),
  label:     Joi.string().min(1).max(50).required(),
  sortOrder: Joi.number().integer().min(0).max(255).required(),
});

export const createSchoolSchema = Joi.object({
  schoolName:          Joi.string().min(2).max(255).required(),
  schoolType:          Joi.array().items(Joi.string()).min(1).required(),
  primaryEmail:        Joi.string().email().required(),
  primaryPhoneNumber:  Joi.string().min(7).max(20).required(),
  cac:                 Joi.string().min(1).max(100).required(),
  location:            locationSchema.required(),
  gradeClasses:        Joi.array().items(gradeClassItemSchema).min(1).required(),
});

export const inviteSchoolAdminSchema = Joi.object({
  fullName: Joi.string().min(2).max(255).required(),
  email:    Joi.string().email().required(),
});

export const createStudentUnderSchoolSchema = Joi.object({
  parentEmail:    Joi.string().email().required(),
  parentFullName: Joi.string().min(2).max(255).required(),
  firstName:      Joi.string().min(1).max(255).required(),
  lastName:       Joi.string().min(1).max(255).required(),
  classId:        Joi.string().uuid().required(),
  age:            Joi.number().integer().min(1).max(30).required(),
});

const invoiceItemSchema = Joi.object({
  feeTypeId: Joi.string().uuid().required(),
  quantity:  Joi.number().integer().positive().required(),
  unitPrice: Joi.number().positive().required(),
});

export const createInvoiceUnderSchoolSchema = Joi.object({
  studentId: Joi.string().required(),
  items:     Joi.array().items(invoiceItemSchema).min(1).required(),
  remarks:   Joi.string().max(500).optional(),
});

export const createParentUnderSchoolSchema = Joi.object({
  fullName:    Joi.string().min(2).max(255).required(),
  email:       Joi.string().email().required(),
  phoneNumber: Joi.string().min(7).max(20).required(),
});
