import "dotenv/config";
import request from "supertest";
import { describe, it, expect, vi } from "vitest";
import prismaClient from "../src/config/prisma.js";
import app from "../src/app.js";

vi.mock("../src/services/email.service.js", () => ({
  sendOTPEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

describe("POST /event", () => {
  it("should create an event successfully", async () => {
    const email = `event-${Date.now()}@gmail.com`;

    await request(app)
      .post("/auth/register")
      .send({
        firstName: "Event",
        lastName: "Admin",
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

    const login = await request(app)
      .post("/auth/login")
      .send({
        email,
        password: "Password123",
      });

    const response = await request(app)
      .post("/event")
      .set("Authorization", `Bearer ${login.body.accessToken}`)
      .send({
        title: "Christmas Gift Exchange",
        description: "Annual Christmas gift exchange",
        participants: "John, Jane, Peter",
        startDate: "2026-12-01T10:00:00.000Z",
        deadline: "2026-12-20T23:59:59.000Z",
      });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe("Christmas Gift Exchange");
    expect(response.body.participants).toHaveLength(3);
  });
  it("should reject event creation with invalid data", async () => {
  const email = `event-invalid-${Date.now()}@gmail.com`;

  await request(app)
    .post("/auth/register")
    .send({
      firstName: "Event",
      lastName: "Admin",
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

  const login = await request(app)
    .post("/auth/login")
    .send({
      email,
      password: "Password123",
    });

  const response = await request(app)
    .post("/event")
    .set("Authorization", `Bearer ${login.body.accessToken}`)
    .send({
      title: "",
      description: "",
      participants: "",
      startDate: "invalid-date",
      deadline: "invalid-date",
    });

  expect(response.status).toBe(400);
});it("should reject event creation without authentication", async () => {
  const response = await request(app)
    .post("/event")
    .send({
      title: "Christmas Gift Exchange",
      description: "Annual Christmas gift exchange",
      participants: "John, Jane, Peter",
      startDate: "2026-12-01T10:00:00.000Z",
      deadline: "2026-12-20T23:59:59.000Z",
    });

  expect(response.status).toBe(401);
});
});

describe("GET /event/all", () => {
  it("should return all events created by the admin", async () => {
    const email = `events-${Date.now()}@gmail.com`;

    await request(app)
      .post("/auth/register")
      .send({
        firstName: "Events",
        lastName: "Admin",
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

    const login = await request(app)
      .post("/auth/login")
      .send({
        email,
        password: "Password123",
      });

    await prismaClient.event.create({
      data: {
        title: "Test Event",
        description: "Test Description",
        startDate: new Date("2026-12-01"),
        deadline: new Date("2026-12-20"),
        createdById: admin!.id,
      },
    });

    const response = await request(app)
      .get("/event/all")
      .set("Authorization", `Bearer ${login.body.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe("Test Event");
  });
  it("should return 404 when the admin has no events", async () => {
  const email = `no-events-${Date.now()}@gmail.com`;

  const register = await request(app)
  .post("/auth/register")
  .send({
    firstName: "Now",
    lastName: "Events",
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

  const login = await request(app)
    .post("/auth/login")
    .send({
      email,
      password: "Password123",
    });

  const response = await request(app)
    .get("/event/all")
    .set("Authorization", `Bearer ${login.body.accessToken}`);

  expect(response.status).toBe(404);
  expect(response.body.message).toBe("No events found");
});
});

describe("GET /event/:id", () => {
  it("should return an event successfully", async () => {
    const email = `get-event-${Date.now()}@gmail.com`;

    // Register
    await request(app)
      .post("/auth/register")
      .send({
        firstName: "Get",
        lastName: "Event",
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
        startDate: "2026-12-20",
        deadline: "2026-12-15",
      });

    const eventId = eventResponse.body.id;

    // Get event
    const response = await request(app)
      .get(`/event/${eventId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(eventId);
    expect(response.body.title).toBe("Christmas Gift Exchange");
    expect(response.body.description).toBe(
      "Christmas gift exchange event"
    );
  });
});

describe("PATCH /event/:id", () => {
  it("should update an event successfully", async () => {
    const email = `update-event-${Date.now()}@gmail.com`;

    await request(app)
      .post("/auth/register")
      .send({
        firstName: "Update",
        lastName: "Event",
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

    const loginResponse = await request(app)
      .post("/auth/login")
      .send({
        email,
        password: "Password123",
      });

    const accessToken = loginResponse.body.accessToken;

    const eventResponse = await request(app)
      .post("/event")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Old Title",
        description: "Old description",
        participants: "John, Jane, Peter",
        startDate: "2026-12-20",
        deadline: "2026-12-15",
      });

    const eventId = eventResponse.body.id;

    const response = await request(app)
      .patch(`/event/${eventId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Updated Title",
        description: "Updated description",
      });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe("Updated Title");
    expect(response.body.description).toBe("Updated description");
  });
    it("should return 404 if the event does not exist", async () => {
    const email = `patch-not-found-${Date.now()}@gmail.com`;

    await request(app)
        .post("/auth/register")
        .send({
        firstName: "Patch",
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

    const loginResponse = await request(app)
        .post("/auth/login")
        .send({
        email,
        password: "Password123",
        });

    const accessToken = loginResponse.body.accessToken;

    const response = await request(app)
        .patch("/event/999999")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
        title: "Updated Title",
        });

  expect(response.status).toBe(404);
  expect(response.body.message).toBe("Event not found");
});
});

describe("DELETE /event/:id", () => {
  it("should delete an event successfully", async () => {
    const email = `delete-event-${Date.now()}@gmail.com`;

    await request(app)
      .post("/auth/register")
      .send({
        firstName: "Delete",
        lastName: "Event",
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

    const loginResponse = await request(app)
      .post("/auth/login")
      .send({
        email,
        password: "Password123",
      });

    const accessToken = loginResponse.body.accessToken;

    const eventResponse = await request(app)
      .post("/event")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Event To Delete",
        description: "This event will be deleted",
        participants: "John, Jane, Peter",
        startDate: "2026-12-20",
        deadline: "2026-12-15",
      });

    const eventId = eventResponse.body.id;

    const response = await request(app)
      .delete(`/event/${eventId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    console.log("DELETE STATUS:", response.status);
    console.log("DELETE BODY:", response.body);
    console.log("DELETE TEXT:", response.text);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Event deleted successfully");

    const deletedEvent = await prismaClient.event.findUnique({
      where: { id: eventId },
    });

    expect(deletedEvent).toBeNull();
  });
});