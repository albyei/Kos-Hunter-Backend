import { NextFunction, Request, Response } from "express";
import Joi from "joi";

const createKosImageSchema = Joi.object({
  kosId: Joi.number().integer().positive().required().messages({
    "number.base": "Kos ID is required and must be a valid number",
    "number.integer": "Kos ID must be an integer",
    "number.positive": "Kos ID must be a positive number",
    "any.required": "Kos ID is required",
  }),
  image: Joi.any().optional(), // Handled by multer, not validated by Joi
});
const updateKosImageSchema = Joi.object({
  kosId: Joi.number().integer().positive().optional().messages({
    "number.base": "Kos ID is required and must be a valid number",
    "number.integer": "Kos ID must be an integer",
    "number.positive": "Kos ID must be a positive number",
  }),
  image: Joi.any().optional(), // Handled by multer, not validated by Joi
})

export const verifyCreateKosImage = (req: Request, res: Response, next: NextFunction) => {
  const { error } = createKosImageSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details.map((it) => it.message).join(", "),
    });
  }
  if (!req.file) {
    return res.status(400).json({ status: false, message: "No image provided" });
  }
  return next();
};

export const verifyUpdateKosImage = (req: Request, res: Response, next: NextFunction) => {
  const { error } = updateKosImageSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details.map((it) => it.message).join(", "),
    });
  }
  return next();
};