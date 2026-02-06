import { NextFunction, Request, Response } from "express";
import Joi from "joi";

const createReviewSchema = Joi.object({
  kosId: Joi.number().integer().positive().required().messages({
    "number.base": "Kos ID is required and must be a valid number",
    "number.integer": "Kos ID must be an integer",
    "number.positive": "Kos ID must be a positive number",
    "any.required": "Kos ID is required",
  }),
  comment: Joi.string().trim().required().messages({
    "string.empty": "Comment is required and must be a non-empty string",
    "any.required": "Comment is required",
  }),
  rating: Joi.number().integer().min(1).max(5).required().messages({
    "number.base": "Rating is required and must be a valid number",
    "number.integer": "Rating must be an integer",
    "number.min": "Rating must be at least 1",
    "number.max": "Rating must not exceed 5",
    "any.required": "Rating is required",
  }),
});

const updateReviewSchema = Joi.object({
  comment: Joi.string().trim().optional().messages({
    "string.base": "Comment must be a string",
    "string.empty": "Comment cannot be an empty string",
  }),
  rating: Joi.number().integer().min(1).max(5).optional().messages({
    "number.base": "Rating must be a valid number",
    "number.integer": "Rating must be an integer",
    "number.min": "Rating must be at least 1",
    "number.max": "Rating must not exceed 5",
  }),
}).min(1);

const reviewIdSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Review ID is required and must be a valid number",
    "number.integer": "Review ID must be an integer",
    "number.positive": "Review ID must be a positive number",
    "any.required": "Review ID is required",
  }),
});

const replyReviewSchema = Joi.object({
  reply_comment: Joi.string().trim().optional().messages({
    "string.base": "Reply comment must be a string",
    "string.empty": "Reply comment cannot be an empty string if provided",
  }),
}).min(1); // Minimal satu field jika update

export const verifyCreateReview = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = createReviewSchema.validate(req.body, {
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

export const verifyUpdateReview = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error: paramError } = updateReviewSchema.validate(req.body, {
    abortEarly: false,
  });
  if (paramError) {
    return res.status(400).json({
      status: false,
      message: paramError.details.map((it) => it.message).join(", "),
    });
  }
  const { error: bodyError } = updateReviewSchema.validate(req.body, {
    abortEarly: false,
  });
  if (bodyError) {
    return res.status(400).json({
      status: false,
      message: bodyError.details.map((it) => it.message).join(", "),
    });
  }

  return next();
};

export const verifyDeleteReview = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = reviewIdSchema.validate(req.params, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details.map((it) => it.message).join(", "),
    });
  }
  return next();
};

export const verifyReplyReview = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error: paramError } = reviewIdSchema.validate(req.params, {
    abortEarly: false,
  });
  if (paramError) {
    return res.status(400).json({
      status: false,
      message: paramError.details.map((it) => it.message).join(", "),
    });
  }

  const { error: bodyError } = replyReviewSchema.validate(req.body, {
    abortEarly: false,
  });
  if (bodyError) {
    return res.status(400).json({
      status: false,
      message: bodyError.details.map((it) => it.message).join(", "),
    });
  }

  return next();
};
