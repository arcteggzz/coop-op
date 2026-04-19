// U04: Parent self-registration of students is DISABLED.
// STUDENT_CLASSES and addStudentSchema are kept for reference only.
// The /api/parents/student/add route is commented out in parentDashboard.routes.ts.

// import Joi from "joi";

// export const STUDENT_CLASSES = [
//   "Creche 1", "Creche 2", "Creche 3", "Creche 4", "Creche 5",
//   "KG 1", "KG 2", "KG 3", "KG 4", "KG 5",
//   "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
//   "JSS 1", "JSS 2", "JSS 3",
//   "SS 1", "SS 2", "SS 3",
// ] as const;

// export type StudentClass = (typeof STUDENT_CLASSES)[number];

// export const addStudentSchema = Joi.object({
//   schoolId: Joi.string().uuid().required(),
//   firstName: Joi.string().min(1).required(),
//   lastName: Joi.string().min(1).required(),
//   currentClass: Joi.string().valid(...STUDENT_CLASSES).required(),
//   age: Joi.number().integer().min(1).required(),
// });
