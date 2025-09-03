import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import logger from "../utils/logger";
import { BASE_URL } from "../global";

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
  };
}

const prisma = new PrismaClient({ errorFormat: "pretty" });

export const createReview = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const { kosId, comment, rating } = request.body;
    const userId = request.user?.id;
    if (!userId) {
      return response
        .status(401)
        .json({ status: false, message: "Unauthorized: No user ID provided" });
    }

    const newReview = await prisma.review.create({
      data: {
        uuid: uuidv4(),
        kosId: parseInt(kosId),
        userId,
        comment: comment.trim(),
        rating: parseInt(rating),
      },
    });

    logger.info(`Review added for kos ID ${kosId} by user ID ${userId}`);
    return response.status(201).json({
      status: true,
      data: newReview,
      message: "Review has been created",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    logger.error(`Failed to create review: ${message}`);
    return response.status(400).json({
      status: false,
      message: `Failed to create review: ${message}`,
    });
  }
};

export const updateReview = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const { id } = request.params;
    const { comment, rating } = request.body;
    const userId = request.user?.id;
    if (!userId) {
      return response
        .status(401)
        .json({ status: false, message: "Unauthorized: No user ID provided" });
    }

    const review = await prisma.review.findFirst({
      where: { id: parseInt(id) },
    });
    if (!review) {
      return response
        .status(404)
        .json({ status: false, message: "Review not found" });
    }

    const updatedReview = await prisma.review.update({
      where: { id: parseInt(id) },
      data: {
        ...(comment && { comment: comment.trim() }), // Update comment jika ada
        ...(rating && { rating: parseInt(rating) }), // Update rating jika ada
      },
    });

    logger.info(
      `Review updated for review ID ${id} by user ID ${userId}`
    );
    return response.status(200).json({
      status: true,
      data: updatedReview,
      message: "Review has been updated",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    logger.error(`Failed to update review: ${message}`);
    return response.status(400).json({
      status: false,
      message: `Failed to update review: ${message}`,
    });
  }
};

export const deleteReview = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const { id } = request.params;
    const userId = request.user?.id;
    if (!userId) {
      return response
        .status(401)
        .json({ status: false, message: "Unauthorized: No user ID provided" });
    }

    const review = await prisma.review.findFirst({
      where: { id: parseInt(id), userId },
    });
    if (!review) {
      return response
        .status(404)
        .json({ status: false, message: "Review not found" });
    }

    await prisma.review.delete({
      where: { id: parseInt(id) },
    });

    logger.info(
      `Review deleted for review ID ${id} by user ID ${userId}`
    );
    return response.status(200).json({
      status: true,
      message: "Review has been deleted",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    logger.error(`Failed to delete review: ${message}`);
    return response.status(400).json({
      status: false,
      message: `Failed to delete review: ${message}`,
    });
  }
};
