import request from "supertest";
import app from "../../src/index";

describe("Index Routes and Middleware", () => {
  it("POST /user/create with duplicate idempotency-key should return 409", async () => {
    const idempotencyKey = "unique-key-123";
    const userData = {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      phone: 1234567890, // Tambahkan phone
      role: "SOCIETY", // Tambahkan role
    };
    await request(app)
      .post("/user/create")
      .set("idempotency-key", idempotencyKey)
      .send(userData)
      .expect(201);
    const response = await request(app)
      .post("/user/create")
      .set("idempotency-key", idempotencyKey)
      .send(userData)
      .expect(409);
    expect(response.body).toMatchObject({
      status: false,
      message: "Request already processed",
    });
  });
});
