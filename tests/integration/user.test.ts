import request from "supertest";
import app from "../../src/index"; // Pastikan path sesuai dengan file utama Express Anda
describe("User Routes", () => {
  it("GET /user - should return list of users", async () => {
    const response = await request(app).get("/user").expect(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        { id: 1, name: "Test User", email: "test@example.com" },
      ])
    );
  });

  it("POST /user/create - should create a new user", async () => {
    const newUser = {
      name: "New User",
      email: "new@example.com",
      password: "password123",
      phone: 1234567890, // Tambahkan phone
      role: "SOCIETY", // Tambahkan role
    };
    const response = await request(app)
      .post("/user/create")
      .field("name", newUser.name)
      .field("email", newUser.email)
      .field("password", newUser.password)
      .field("phone", newUser.phone.toString()) // Konversi ke string jika multer mengharuskannya
      .field("role", newUser.role)
      .attach("picture", Buffer.from("mocked-image"), "mocked-image.jpg")
      .expect(201);
    expect(response.body).toMatchObject({
      id: 1,
      name: "New User",
      email: "new@example.com",
    });
  });

  // Tes PUT /:id
  it("PUT /:id - should update a user", async () => {
    const updatedUser = { name: "Updated User", email: "updated@example.com" };
    const response = await request(app)
      .put("/1")
      .field("name", updatedUser.name)
      .field("email", updatedUser.email)
      .attach("picture", Buffer.from("mocked-image"), "mocked-image.jpg")
      .expect(200);

    expect(response.body).toMatchObject({
      id: 1,
      name: "Updated User",
      email: "updated@example.com",
    });
  });

  // Tes POST /login
  it("POST /login - should authenticate user", async () => {
    const credentials = { email: "test@example.com", password: "password123" };
    const response = await request(app)
      .post("/login")
      .send(credentials)
      .expect(200);

    expect(response.body).toHaveProperty("token"); // Pastikan ada token JWT
  });

  // Tes PUT /pic/:id
  it("PUT /pic/:id - should change profile picture", async () => {
    const response = await request(app)
      .put("/pic/1")
      .attach("picture", Buffer.from("mocked-image"), "mocked-image.jpg")
      .expect(200);

    expect(response.body).toHaveProperty("message", "Profile picture updated");
  });

  // Tes DELETE /:id
  it("DELETE /:id - should delete a user", async () => {
    const response = await request(app).delete("/1").expect(200);
    expect(response.body).toMatchObject({ id: 1, name: "Test User" });
  });

  // Tes GET /profile/:id
  it("GET /profile/:id - should return user by id", async () => {
    const response = await request(app).get("/profile/1").expect(200);
    expect(response.body).toMatchObject({
      id: 1,
      name: "Test User",
      email: "test@example.com",
    });
  });

  // Tes GET /profile
  it("GET /profile - should return authenticated user profile", async () => {
    const response = await request(app).get("/profile").expect(200);
    expect(response.body).toMatchObject({
      id: 1,
      name: "Test User",
      email: "test@example.com",
    });
  });
});
