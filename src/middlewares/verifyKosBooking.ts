import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import logger from "../utils/logger";

const createBookingSchema = Joi.object({
  kosId: Joi.number().integer().positive().required().messages({
    "number.base": "Kos ID is required and must be a valid number",
    "number.integer": "Kos ID must be an integer",
    "number.positive": "Kos ID must be a positive number",
    "any.required": "Kos ID is required",
  }),
  startDate: Joi.date().iso().required().messages({
    "date.base": "Start date is required and must be a valid ISO date",
    "any.required": "Start date is required",
  }),
  endDate: Joi.date().iso().greater(Joi.ref("startDate")).required().messages({
    "date.base": "End date is required and must be a valid ISO date",
    "date.greater": "End date must be after start date",
    "any.required": "End date is required",
  }),
});

const updateBookingSchema = Joi.object({
  startDate: Joi.date().iso().optional().messages({
    "date.base": "Start date must be a valid ISO date",
  }),
  endDate: Joi.date()
    .iso()
    .optional()
    .when("startDate", {
      is: Joi.exist(),
      then: Joi.date().greater(Joi.ref("startDate")).messages({
        "date.greater": "End date must be after start date",
      }),
    })
    .messages({
      "date.base": "End date must be a valid ISO date",
    }),
  status: Joi.string()
    .valid("PENDING", "ACCEPTED", "REJECTED", "CANCELLED")
    .optional()
    .messages({
      "any.only": "Status must be PENDING, ACCEPTED, REJECTED, or CANCELLED",
    }),
}).min(1);

const bookingIdSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Booking ID is required and must be a valid number",
    "number.integer": "Booking ID must be an integer",
    "number.positive": "Booking ID must be a positive number",
    "any.required": "Booking ID is required",
  }),
});

const bookingHistoryQuerySchema = Joi.object({
  month: Joi.number().integer().min(1).max(12).optional().messages({
    "number.base": "Month must be a valid number",
    "number.integer": "Month must be an integer",
    "number.min": "Month must be at least 1",
    "number.max": "Month must not exceed 12",
  }),
  year: Joi.number().integer().positive().optional().messages({
    "number.base": "Year must be a valid number",
    "number.integer": "Year must be an integer",
    "number.positive": "Year must be a positive number",
  }),
  startDate: Joi.date().iso().optional().messages({
    "date.base": "Start date must be a valid ISO date",
  }),
  endDate: Joi.date()
    .iso()
    .optional()
    .when("startDate", {
      is: Joi.exist(),
      then: Joi.date().greater(Joi.ref("startDate")).messages({
        "date.greater": "End date must be after start date",
      }),
    })
    .messages({
      "date.base": "End date must be a valid ISO date",
    }),
}).or("month", "startDate", "year"); // Hanya salah satu dari month atau startDate

export const verifyCreateBooking = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = createBookingSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details.map((it) => it.message).join(", "),
    });
  }
  return next();
};

export const verifyUpdateBooking = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.info(`Update booking request body: ${JSON.stringify(req.body)}`);
  const { error: paramError } = bookingIdSchema.validate(req.params, {
    abortEarly: false,
  });
  if (paramError) {
    logger.error(
      `Update booking param validation failed: ${paramError.details
        .map((it) => it.message)
        .join(", ")}`
    );
    return res.status(400).json({
      status: false,
      message: paramError.details.map((it) => it.message).join(", "),
    });
  }

  const { error: bodyError } = updateBookingSchema.validate(req.body, {
    abortEarly: false,
  });
  if (bodyError) {
    logger.error(
      `Update booking body validation failed: ${bodyError.details
        .map((it) => it.message)
        .join(", ")}`
    );
    return res.status(400).json({
      status: false,
      message: bodyError.details.map((it) => it.message).join(", "),
    });
  }

  return next();
};

export const verifyDeleteBooking = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = bookingIdSchema.validate(req.params, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details.map((it) => it.message).join(", "),
    });
  }
  return next();
};

export const verifyGetBookingById = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = bookingIdSchema.validate(req.params, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details.map((it) => it.message).join(", "),
    });
  }
  return next();
};

export const verifyGetBookingHistory = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = bookingHistoryQuerySchema.validate(req.query, {
    abortEarly: false,
  });
  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details.map((it) => it.message).join(", "),
    });
  }
  return next();
};
