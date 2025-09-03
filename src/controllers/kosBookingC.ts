import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import logger from "../utils/logger";
import { info } from "console";

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

export const createBooking = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const { kosId, startDate, endDate } = request.body;
    const userId = request.user?.id;
    if (!userId) {
      return response
        .status(401)
        .json({ status: false, message: "Unauthorized: No user ID provided" });
    }

    const newBooking = await prisma.book.create({
      data: {
        uuid: uuidv4(),
        kosId: parseInt(kosId),
        userId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: "PENDING",
      },
    });

    logger.info(`Booking created for kos ID ${kosId} by user ID ${userId}`);
    return response.status(201).json({
      status: true,
      data: newBooking,
      message: "Booking has been created",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    logger.error(`Failed to create booking: ${message}`);
    return response.status(400).json({
      status: false,
      message: `Failed to create booking: ${message}`,
    });
  }
};

export const updateBooking = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const { id } = request.params;
    const { startDate, endDate, status } = request.body;
    const userId = request.user?.id;
    const userRole = request.user?.role;

    logger.info(
      `Update booking request for ID ${id}: ${JSON.stringify(request.body)}`
    );

    if (!userId) {
      return response
        .status(401)
        .json({ status: false, message: "Unauthorized: No user ID provided" });
    }

    const booking = await prisma.book.findFirst({
      where: { id: parseInt(id) },
      include: { kos: true },
    });

    if (!booking) {
      return response
        .status(404)
        .json({ status: false, message: "Booking not found" });
    }

    // Validasi otorisasi
    if (userRole === "SOCIETY" && booking.userId !== userId) {
      return response
        .status(403)
        .json({
          status: false,
          message: "Not authorized to update this booking",
        });
    }
    if (userRole === "OWNER" && booking.kos.ownerId !== userId) {
      return response
        .status(403)
        .json({
          status: false,
          message: "Not authorized to update this booking",
        });
    }

    // Siapkan data untuk update
    const updateData: any = {};
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (status) {
      if (userRole === "OWNER") {
        updateData.status = status; // OWNER bisa set PENDING, ACCEPTED, REJECTED
      } else if (userRole === "SOCIETY" && status === "CANCELLED") {
        updateData.status = status; // SOCIETY hanya bisa set CANCELLED
      }
    }

    if (Object.keys(updateData).length === 0) {
      return response
        .status(400)
        .json({
          status: false,
          message: "No valid fields provided for update",
        });
    }

    const updatedBooking = await prisma.book.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    logger.info(
      `Booking updated for booking ID ${id} by user ID ${userId}: ${JSON.stringify(
        updateData
      )}`
    );
    return response.status(200).json({
      status: true,
      data: updatedBooking,
      message: "Booking has been updated",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    logger.error(`Failed to update booking: ${message}`);
    return response.status(400).json({
      status: false,
      message: `Failed to update booking: ${message}`,
    });
  }
};

export const deleteBooking = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const { id } = request.params;
    const userId = request.user?.id;
    const userRole = request.user?.role;

    if (!userId) {
      return response
        .status(401)
        .json({ status: false, message: "Unauthorized: No user ID provided" });
    }

    const booking = await prisma.book.findFirst({
      where: { id: parseInt(id) },
      include: { kos: true },
    });

    if (!booking) {
      return response
        .status(404)
        .json({ status: false, message: "Booking not found" });
    }

    if (userRole === "SOCIETY" && booking.userId !== userId) {
      return response.status(403).json({
        status: false,
        message: "Not authorized to delete this booking",
      });
    }
    if (userRole === "OWNER" && booking.kos.ownerId !== userId) {
      return response.status(403).json({
        status: false,
        message: "Not authorized to delete this booking",
      });
    }

    await prisma.book.delete({
      where: { id: parseInt(id) },
    });

    logger.info(`Booking deleted for booking ID ${id} by user ID ${userId}`);
    return response.status(200).json({
      status: true,
      message: "Booking has been deleted",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    logger.error(`Failed to delete booking: ${message}`);
    return response.status(400).json({
      status: false,
      message: `Failed to delete booking: ${message}`,
    });
  }
};

export const getBookingById = async (
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

    const booking = await prisma.book.findFirst({
      where: { id: parseInt(id), userId },
      include: {
        kos: {
          select: {
            name: true,
            address: true,
            pricePerMonth: true,
            owner: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      return response.status(404).json({
        status: false,
        message: "Booking not found or not authorized",
      });
    }

    logger.info(
      `Booking details retrieved for booking ID ${id} by user ID ${userId}`
    );
    return response.status(200).json({
      status: true,
      data: booking,
      message: "Booking details retrieved successfully",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    logger.error(`Failed to retrieve booking: ${message}`);
    return response.status(400).json({
      status: false,
      message: `Failed to retrieve booking: ${message}`,
    });
  }
};

export const getBookingsByOwner = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const { month, year, startDate, endDate } = request.query;
    const userId = request.user?.id;

    if (!userId) {
      return response
        .status(401)
        .json({ status: false, message: "Unauthorized: No user ID provided" });
    }

    const where: any = {
      kos: { ownerId: userId },
    };

    // Filter berdasarkan bulan dan tahun
    if (month && year) {
      const monthNum = parseInt(month as string);
      const yearNum = parseInt(year as string);
      where.startDate = {
        gte: new Date(yearNum, monthNum - 1, 1),
        lt: new Date(yearNum, monthNum, 1),
      };
    } else if (startDate && endDate) {
      where.startDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const bookings = await prisma.book.findMany({
      where,
      include: {
        kos: {
          select: {
            name: true,
            address: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    logger.info(`Booking history retrieved for owner ID ${userId}`);
    return response.status(200).json({
      status: true,
      data: bookings,
      message: "Booking history retrieved successfully",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    logger.error(`Failed to retrieve booking history: ${message}`);
    return response.status(400).json({
      status: false,
      message: `Failed to retrieve booking history: ${message}`,
    });
  }
};
