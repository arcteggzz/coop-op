import Joi from "joi";

export const promoteSingleStudentSchema = Joi.object({
  toClassId: Joi.string().uuid().required(),
});

export const promoteClassSchema = Joi.object({
  fromClassId: Joi.string().uuid().required(),
  toClassId: Joi.string().uuid().required(),
});

export const graduateClassSchema = Joi.object({
  fromClassId: Joi.string().uuid().required(),
});

export const adminPromoteClassSchema = Joi.object({
  schoolId: Joi.string().uuid().required(),
  fromClassId: Joi.string().uuid().required(),
  toClassId: Joi.string().uuid().required(),
});

export const adminGraduateClassSchema = Joi.object({
  schoolId: Joi.string().uuid().required(),
  fromClassId: Joi.string().uuid().required(),
});
