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

export const createKosFacility = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const { kosId, facility } = request.body;

    const newFacility = await prisma.kosFacility.create({
      data: {
        uuid: uuidv4(),
        kosId: parseInt(kosId),
        facility: facility.trim(),
      },
    });

    logger.info(`Kos facility added for kos ID ${kosId}`);
    return response.status(201).json({
      status: true,
      data: newFacility,
      message: "Kos facility has been added",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    logger.error(`Failed to add kos facility: ${message}`);
    return response.status(400).json({
      status: false,
      message: `Failed to add kos facility: ${message}`,
    });
  }
};

export const updateKosFacility = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const { id } = request.params;
    const { kosId, facility } = request.body;

    const existingFacility = await prisma.kosFacility.findFirst({
      where: { id: Number(id) },
    });

    if (!existingFacility) {
      return response
        .status(404)
        .json({ status: false, message: "Facility not found" });
    }

    const updatedFacility = await prisma.kosFacility.update({
      where: { id: Number(id) },
      data: {
        kosId: parseInt(kosId),
        facility: facility.trim(),
      },
    });    

    logger.info(`Kos facility updated for kos ID ${kosId}`);
    return response.status(200).json({
      status: true,
      data: updatedFacility,
      message: "Kos facility has been updated",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    logger.error(`Failed to update kos facility: ${message}`);
    return response.status(400).json({
      status: false,
      message: `Failed to update kos facility: ${message}`,
    });
  }
};

export const deleteKosFacility = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const { id } = request.params;
    const facility = await prisma.kosFacility.findFirst({
      where: { id: Number(id) },
    });
    if (!facility) {
      return response
        .status(404)
        .json({ status: false, message: "Facility not found" });
    }

    await prisma.kosFacility.delete({
      where: { id: Number(id) },
    });

    logger.info(`Kos facility deleted for facility ID ${id}`);
    return response.status(200).json({
      status: true,
      message: "Kos facility has been deleted",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    logger.error(`Failed to delete kos facility: ${message}`);
    return response.status(400).json({
      status: false,
      message: `Failed to delete kos facility: ${message}`,
    });
  }
};
