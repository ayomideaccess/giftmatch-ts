import "dotenv/config";
import request from "supertest";
import { describe, it, expect } from "vitest";
import prismaClient from "../src/config/prisma.js";
import app from "../src/app.js";

describe("POST /request/:eventId", () => {
  it("should send a special request successfully", async () => {
    const email = `request-${Date.now()}@gmail.com`;

    // Register admin
    await request(app)
      .post("/auth/register")
      .send({
        firstName: "Request",
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

    // Login
    const loginResponse = await request(app)
      .post("/auth/login")
      .send({
        email,
        password: "Password123",
      });

    const accessToken = loginResponse.body.accessToken;

    // Create event
    const eventResponse = await request(app)
      .post("/event")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Christmas Gift Exchange",
        description: "Christmas gift exchange event",
        participants: "John, Jane, Peter",
        startDate: "2026-08-20",
        deadline: "2026-12-15",
      });

    expect(eventResponse.status).toBe(201);

    const eventId = eventResponse.body.id;

    // Anyone can send a special request
    const response = await request(app)
      .post(`/request/${eventId}`)
      .send({
        name: "John",
        emailAdd: "john@gmail.com",
        phone: "08012345678",
        wantToGift: "Jane",
        description: "I would like to give Jane a special gift.",
      });

    expect(response.status).toBe(201);

    expect(response.body.message).toBe(
      "Special Request sent successfully"
    );

    expect(response.body.request).toBeDefined();
    expect(response.body.request.name).toBe("John");
    expect(response.body.request.emailAdd).toBe("john@gmail.com");
    expect(response.body.request.phone).toBe("08012345678");
    expect(response.body.request.wantToGift).toBe("Jane");
    expect(response.body.request.description).toBe(
      "I would like to give Jane a special gift."
    );
  });
  it("should return 404 if the event does not exist", async () => {
  const response = await request(app)
    .post("/request/999999")
    .send({
      name: "John",
      emailAdd: "john@gmail.com",
      phone: "08012345678",
      wantToGift: "Jane",
      description: "I would like to give Jane a special gift.",
    });

  expect(response.status).toBe(404);
  expect(response.body.message).toBe("Event not found");
});
  it("should reject a special request with invalid data", async () => {
  const response = await request(app)
    .post("/request/1")
    .send({
      name: "",
      emailAdd: "invalid-email",
      phone: "",
      wantToGift: "",
      description: "",
    });

  expect(response.status).toBe(400);
});
  it("should save the special request in the database", async () => {
  const admin = await prismaClient.admin.create({
    data: {
      firstName: "Request",
      lastName: "Test",
      email: `request-db-${Date.now()}@gmail.com`,
      phoneNo: "08012345678",
      password: "Password123",
      isVerified: true,
    },
  });

  const event = await prismaClient.event.create({
    data: {
      title: "Gift Exchange",
      description: "Test event",
      startDate: new Date("2026-08-20"),
      deadline: new Date("2026-12-15"),
      createdById: admin.id,
    },
  });

  const response = await request(app)
    .post(`/request/${event.id}`)
    .send({
      name: "John",
      emailAdd: "john@gmail.com",
      phone: "08012345678",
      wantToGift: "Jane",
      description: "I want to give Jane a special gift.",
    });

  expect(response.status).toBe(201);

  const specialRequest =
    await prismaClient.specialRequest.findFirst({
      where: {
        eventId: event.id,
        name: "John",
      },
    });

  expect(specialRequest).not.toBeNull();
  expect(specialRequest!.emailAdd).toBe("john@gmail.com");
  expect(specialRequest!.phone).toBe("08012345678");
  expect(specialRequest!.wantToGift).toBe("Jane");
  expect(specialRequest!.description).toBe(
    "I want to give Jane a special gift."
  );
});
});