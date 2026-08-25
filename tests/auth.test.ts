import "dotenv/config";
import request from "supertest";
import { describe, it, expect, vi } from "vitest";
import prismaClient from "../src/config/prisma.js";
import app from "../src/app.js";

vi.mock("../src/services/email.service.js", () => ({
  sendOTPEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

describe("POST /auth/register", () => {
  it("should register a new admin successfully", async () => {
    const response = await request(app)
      .post("/auth/register")
      .send({
        firstName: "Test",
        lastName: "Admin", 
        email: `test-${Date.now()}@gmail.com`,
        phoneNo: "08012345678",
        password: "Password123",
      });
    console.log("STATUS:", response.status);
    console.log("BODY:", response.body);
    console.log("TEXT:", response.text);
    expect(response.status).toBe(201);

    expect(response.body.message).toBe(
      "User registered successfully. Check your email for OTP."
    );
  });
  it("should reject registration when email already exists", async () => {
  const email = `duplicate-${Date.now()}@gmail.com`;

  await request(app)
    .post("/auth/register")
    .send({
      firstName: "Test",
      lastName: "Admin",
      email,
      phoneNo: "08012345678",
      password: "Password123",
    });

  const response = await request(app)
    .post("/auth/register")
    .send({
      firstName: "Another",
      lastName: "Admin",
      email,
      phoneNo: "08098765432",
      password: "Password456",
    });

  expect(response.status).toBe(409);
  expect(response.body.message).toBe("User already exists");
});
});

describe("POST /auth/verify", () => {
  it("should verify an admin successfully with a valid OTP", async () => {
    const email = `verify-${Date.now()}@gmail.com`;

    await request(app)
      .post("/auth/register")
      .send({
        firstName: "Verify",
        lastName: "Test",
        email,
        phoneNo: "08012345678",
        password: "Password123",
      });

    const existingAdmin = await prismaClient.admin.findUnique({
      where: { email },
    });
    console.log("ADMIN FROM DB:", existingAdmin);

    const response = await request(app)
      .post("/auth/verify")
      .send({
        email,
        otp: existingAdmin?.otp,
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      "Email verified successfully. You can now log in."
    );
  });

  it("should return 400 for an invalid OTP", async () => {
    const email = `invalid-otp-${Date.now()}@gmail.com`;

    await request(app)
      .post("/auth/register")
      .send({
        firstName: "Invalid",
        lastName: "OTP",
        email,
        phoneNo: "08012345678",
        password: "Password123",
      });

    const response = await request(app)
      .post("/auth/verify")
      .send({
        email,
        otp: "000000",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid OTP");
  });

  it("should return 404 if the admin does not exist", async () => {
    const response = await request(app)
      .post("/auth/verify")
      .send({
        email: `nonexistent-${Date.now()}@gmail.com`,
        otp: "123456",
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Admin not found");
  });
});

describe("POST /auth/login", () => {
  it("should login successfully with valid credentials", async () => {
    const email = `login-${Date.now()}@gmail.com`;

    await request(app)
      .post("/auth/register")
      .send({
        firstName: "Login",
        lastName: "Test",
        email,
        phoneNo: "08012345678",
        password: "Password123",
      });

    const admin = await prismaClient.admin.findUnique({
      where: { email },
    });

    await prismaClient.admin.update({
      where: { id: admin!.id },
      data: {
        isVerified: true,
      },
    });

    const response = await request(app)
      .post("/auth/login")
      .send({
        email,
        password: "Password123",
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Login successful");
    expect(response.body.accessToken).toBeDefined();
  });
  it("should reject login with an incorrect password", async () => {
  const email = `wrong-password-${Date.now()}@gmail.com`;

  await request(app)
    .post("/auth/register")
    .send({
      firstName: "Wrong",
      lastName: "Password",
      email,
      phoneNo: "08012345678",
      password: "Password123",
    });

  const admin = await prismaClient.admin.findUnique({
    where: { email },
  });

  await prismaClient.admin.update({
    where: { id: admin!.id },
    data: { isVerified: true },
  });

  const response = await request(app)
    .post("/auth/login")
    .send({
      email,
      password: "WrongPassword",
    });

  expect(response.status).toBe(401);
  expect(response.body.message).toBe("Incorrect password");
});
it("should reject login when email is not verified", async () => {
  const email = `unverified-${Date.now()}@gmail.com`;

  await request(app)
    .post("/auth/register")
    .send({
      firstName: "Unverified",
      lastName: "Test",
      email,
      phoneNo: "08012345678",
      password: "Password123",
    });

  const response = await request(app)
    .post("/auth/login")
    .send({
      email,
      password: "Password123",
    });

  expect(response.status).toBe(400);
  expect(response.body.message).toBe("Email not verified");
});
it("should reject login when admin does not exist", async () => {
  const response = await request(app)
    .post("/auth/login")
    .send({
      email: `nonexistent-${Date.now()}@gmail.com`,
      password: "Password123",
    });

  expect(response.status).toBe(404);
  expect(response.body.message).toBe("Admin not found");
});
});

describe("POST /auth/logout", () => {
  it("should logout successfully", async () => {
    const response = await request(app)
      .post("/auth/logout");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Logout successful");
  });
});

describe("POST /auth/forgot-password", () => {
  it("should send a password reset OTP successfully", async () => {
    const email = `forgot-${Date.now()}@gmail.com`;

    await request(app)
      .post("/auth/register")
      .send({
        firstName: "Forgot",
        lastName: "Test",
        email,
        phoneNo: "08012345678",
        password: "Password123",
      });

    const response = await request(app)
      .post("/auth/forgot-password")
      .send({ email });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      "Password reset email sent. Check your email for OTP."
    );
  });
  it("should return 404 if admin does not exist", async () => {
  const response = await request(app)
    .post("/auth/forgot-password")
    .send({
      email: `doesnotexist-${Date.now()}@gmail.com`,
    });

  expect(response.status).toBe(404);
  expect(response.body.message).toBe("Admin not found");
});
});

describe("POST /auth/resend-otp", () => {
  it("should resend OTP successfully", async () => {
    const email = `resend-${Date.now()}@gmail.com`;

    await request(app)
      .post("/auth/register")
      .send({
        firstName: "Resend",
        lastName: "Test",
        email,
        phoneNo: "08012345678",
        password: "Password123",
      });

    const response = await request(app)
      .post("/auth/resend-otp")
      .send({ email });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Check your email for OTP");
  });
  it("should return 404 if admin does not exist", async () => {
  const response = await request(app)
    .post("/auth/resend-otp")
    .send({
      email: `doesnotexist-${Date.now()}@gmail.com`,
    });

  expect(response.status).toBe(404);
  expect(response.body.message).toBe("Admin not found");
});
});

describe("POST /auth/refresh-token", () => {
  it("should refresh the access token successfully", async () => {
    const email = `refresh-${Date.now()}@gmail.com`;

    await request(app)
      .post("/auth/register")
      .send({
        firstName: "Refresh",
        lastName: "Test",
        email,
        phoneNo: "08012345678",
        password: "Password123",
      });

    const admin = await prismaClient.admin.findUnique({
      where: { email },
    });

    await prismaClient.admin.update({
      where: { id: admin!.id },
      data: { isVerified: true },
    });

    const agent = request.agent(app);

    await agent
      .post("/auth/login")
      .send({
        email,
        password: "Password123",
      });

    const response = await agent
      .post("/auth/refresh-token");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Access token refreshed successfully"
    );
    expect(response.body.accessToken).toBeDefined();
  });
  it("should return 401 if refresh token is missing", async () => {
  const response = await request(app)
    .post("/auth/refresh-token");

  expect(response.status).toBe(401);
  expect(response.body.message).toBe("Refresh token not found");
});
});