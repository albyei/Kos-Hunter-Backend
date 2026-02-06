import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import userR from "./routers/userR"
import kosR from "./routers/kosR"
import kosImageR from "./routers/Kos-ImageR"
import kosFacilityR from "./routers/Kos-FacilityR"
import kosReviewR from "./routers/Kos-ReviewR"
import kosBookingR from "./routers/Kos-BookingR"
import path from "path";
import logger from "./utils/logger";
import { errorHandler } from "./middlewares/errorHandler";

const PORT: number = 7000;
const app = express();

// Middleware untuk mencegah permintaan berulang
const processedRequests = new Set<string>();
app.use((req, res, next) => {
  if (req.method === "POST" && req.url === "/user/create/") {
    const idempotencyKey = req.headers["idempotency-key"] as string;
    if (idempotencyKey && processedRequests.has(idempotencyKey)) {
      return res.status(409).json({ status: false, message: "Request already processed" });
    }
    if (idempotencyKey) processedRequests.add(idempotencyKey);
  }
  next();
});

// Middleware untuk parsing JSON dan URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware untuk mencatat permintaan
app.use((req, res, next) => {
  const safeBody = { ...req.body };
  if (safeBody.password) {
    safeBody.password = "****"; // Mask password
  }
  const logBody = req.method === "GET" ? "none" : JSON.stringify(safeBody, null, 2);
  logger.info(
    `Permintaan masuk: ${req.method} ${req.url}, body: ${logBody}, headers: ${JSON.stringify(req.headers, null, 2)}`
  );
  next();
});

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.static(path.join(__dirname, "..", "public")));

app.use(`/user`, userR);
app.use(`/kos`, kosR);
app.use(`/kosImage`, kosImageR);
app.use(`/kosFacility`, kosFacilityR);
app.use(`/kosReview`, kosReviewR);
app.use(`/kosBooking`, kosBookingR);


app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`[Server]: Server berjalan di http://localhost:${PORT}`);
  });
}

export default app;