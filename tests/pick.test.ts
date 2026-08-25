import "dotenv/config";
import request from "supertest";
import { describe, it, expect, vi } from "vitest";
import prismaClient from "../src/config/prisma.js";
import app from "../src/app.js";

describe("POST /pick/:eventId", () => {
  it("should identify a participant successfully", async () => {
    const email = `pick-${Date.now()}@gmail.com`;

    console.log("1 - before register");

    const registerResponse = await request(app)
    .post("/auth/register")
    .send({
        firstName: "Pick",
        lastName: "Test",
        email,
        phoneNo: "08012345678",
        password: "Password123",
    });

    console.log("2 - after register");
    console.log("REGISTER STATUS:", registerResponse.status);
    console.log("REGISTER BODY:", registerResponse.body); 

    const admin = await prismaClient.admin.findUnique({
      where: { email },
    });

    console.log("3 - admin:", admin?.id);
    await prismaClient.admin.update({
      where: { id: admin!.id },
      data: {
        isVerified: true,
      },
    });


    console.log("4 - after verify");
    const loginResponse = await request(app)
      .post("/auth/login")
      .send({
        email,
        password: "Password123",
      });

    console.log("5 - after login:", loginResponse.status);
    const accessToken = loginResponse.body.accessToken;

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

    console.log("6 - after event:", eventResponse.status);
    const eventId = eventResponse.body.id;

    // Participant identifies themselves
    const response = await request(app)
      .post(`/pick/${eventId}`)
      .send({
        pickerName: "John",
      });
    console.log("7 - after identify:", response.status);
    console.log("8 - body:", response.body);

    expect(response.status).toBe(200);

    expect(response.body.message).toBe(
      "Welcome! Please make your pick."
    );

    expect(response.body.eventTitle).toBe(
      "Christmas Gift Exchange"
    );

    expect(response.body.description).toBe(
      "Christmas gift exchange event"
    );

    expect(response.body.participants).toHaveLength(3);
  });
  it("should return 404 if the event does not exist", async () => {
  const response = await request(app)
    .post("/pick/999999")
    .send({
      pickerName: "John",
    });

  expect(response.status).toBe(404);
  expect(response.body.message).toBe("Event not found");
});
  it("should return 400 if the event has not started", async () => {
  const email = `pick-upcoming-${Date.now()}@gmail.com`;

  // Register
  await request(app)
    .post("/auth/register")
    .send({
      firstName: "Pick",
      lastName: "Upcoming",
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

  // Create an event that starts in the future
  const eventResponse = await request(app)
    .post("/event")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      title: "Upcoming Gift Exchange",
      description: "This event has not started",
      participants: "John, Jane, Peter",
      startDate: "2026-12-20",
      deadline: "2026-12-25",
    });

  expect(eventResponse.status).toBe(201);

  const eventId = eventResponse.body.id;

  // Try to identify before the event starts
  const response = await request(app)
    .post(`/pick/${eventId}`)
    .send({
      pickerName: "John",
    });

  expect(response.status).toBe(400);
  expect(response.body.message).toBe("Event is yet to start");
});
  it("should return 400 if the event has ended", async () => {
  const email = `pick-ended-${Date.now()}@gmail.com`;

  // Register
  await request(app)
    .post("/auth/register")
    .send({
      firstName: "Pick",
      lastName: "Ended",
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

  // Create an already-ended event
  const eventResponse = await request(app)
    .post("/event")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      title: "Ended Gift Exchange",
      description: "This event has ended",
      participants: "John, Jane, Peter",
      startDate: "2026-08-20",
      deadline: "2026-08-21",
    });

  expect(eventResponse.status).toBe(201);

  const eventId = eventResponse.body.id;

  // Try to identify after the deadline
  const response = await request(app)
    .post(`/pick/${eventId}`)
    .send({
      pickerName: "John",
    });

  expect(response.status).toBe(400);
  expect(response.body.message).toBe("Event has ended");
});
  it("should return 404 if the participant is not on the list", async () => {
  const email = `pick-not-found-${Date.now()}@gmail.com`;

  // Register
  await request(app)
    .post("/auth/register")
    .send({
      firstName: "Pick",
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

  // Person not on the list tries to identify
  const response = await request(app)
    .post(`/pick/${eventId}`)
    .send({
      pickerName: "David",
    });

  expect(response.status).toBe(404);
  expect(response.body.message).toBe(
    "Your name is not on the list"
  );
});
  it("should return 400 if the participant has already picked", async () => {
  const email = `pick-already-${Date.now()}@gmail.com`;

  // Register
  await request(app)
    .post("/auth/register")
    .send({
      firstName: "Pick",
      lastName: "Already",
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

  // Get John's participant record
  const john = await prismaClient.participant.findFirst({
    where: {
      eventId,
      name: "John",
    },
  });

  const jane = await prismaClient.participant.findFirst({
    where: {
      eventId,
      name: "Jane",
    },
  });

  // Create an existing pick for John
  await prismaClient.pick.create({
    data: {
      eventId,
      pickerName: john!.name,
      pickedParticipantId: jane!.id,
      pickedName: jane!.name,
    },
  });

  // John tries to identify again
  const response = await request(app)
    .post(`/pick/${eventId}`)
    .send({
      pickerName: "John",
    });

  expect(response.status).toBe(400);
  expect(response.body.message).toBe(
    "You already picked Jane"
  );
});
  it("should return 404 if the event does not exist", async () => {
  const response = await request(app)
    .post("/pick/999999")
    .send({
      pickerName: "John",
    });

  expect(response.status).toBe(404);
  expect(response.body.message).toBe("Event not found");
});
  it("should return 400 if the event has not started", async () => {
  const email = `pick-upcoming-${Date.now()}@gmail.com`;

  // Register
  await request(app)
    .post("/auth/register")
    .send({
      firstName: "Pick",
      lastName: "Upcoming",
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

  // Create future event
  const eventResponse = await request(app)
    .post("/event")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      title: "Upcoming Gift Exchange",
      description: "Event has not started",
      participants: "John, Jane, Peter",
      startDate: "2026-12-20",
      deadline: "2026-12-25",
    });

  expect(eventResponse.status).toBe(201);

  const eventId = eventResponse.body.id;

  // Anyone can identify — no token needed
  const response = await request(app)
    .post(`/pick/${eventId}`)
    .send({
      pickerName: "John",
    });

  expect(response.status).toBe(400);
  expect(response.body.message).toBe(
    "Event is yet to start"
  );
});
  it("should return 400 if the event has ended", async () => {
  const email = `pick-ended-${Date.now()}@gmail.com`;

  await request(app)
    .post("/auth/register")
    .send({
      firstName: "Pick",
      lastName: "Ended",
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
      title: "Ended Gift Exchange",
      description: "Event has ended",
      participants: "John, Jane, Peter",
      startDate: "2026-08-20",
      deadline: "2026-08-24",
    });

  expect(eventResponse.status).toBe(201);

  const eventId = eventResponse.body.id;

  // No authentication required
  const response = await request(app)
    .post(`/pick/${eventId}`)
    .send({
      pickerName: "John",
    });

  expect(response.status).toBe(400);
  expect(response.body.message).toBe("Event has ended");
});
});

describe("POST /pick/make/:eventId", () => {
  it("should make a pick successfully", async () => {
    const email = `make-pick-${Date.now()}@gmail.com`;

    // Register
    await request(app)
      .post("/auth/register")
      .send({
        firstName: "Make",
        lastName: "Pick",
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

    // Get participants
    const john = await prismaClient.participant.findFirst({
      where: {
        eventId,
        name: "John",
      },
    });

    const jane = await prismaClient.participant.findFirst({
      where: {
        eventId,
        name: "Jane",
      },
    });

    // John picks Jane
    const response = await request(app)
      .post(`/pick/make/${eventId}`)
      .send({
        pickerName: "John",
        pickedParticipantId: jane!.id,
        pickedName: "Jane",
      });

    expect(response.status).toBe(201);

    expect(response.body.message).toBe(
      "You have successfully picked Jane"
    );

    // Confirm the pick was actually saved
    const pick = await prismaClient.pick.findFirst({
      where: {
        eventId,
        pickerName: "John",
      },
    });

    expect(pick).not.toBeNull();
    expect(pick!.pickedName).toBe("Jane");

    // Confirm Jane is marked as picked
    const updatedJane = await prismaClient.participant.findUnique({
      where: {
        id: jane!.id,
      },
    });

    expect(updatedJane!.isPicked).toBe(true);
  });
  it("should return 404 if the event does not exist", async () => {
  const response = await request(app)
    .post("/pick/make/999999")
    .send({
      pickerName: "John",
      pickedParticipantId: 1,
      pickedName: "Jane",
    });

  expect(response.status).toBe(404);
  expect(response.body.message).toBe("Event not found");
});
  it("should return 400 if the event has not started", async () => {
  const email = `make-pick-upcoming-${Date.now()}@gmail.com`;

  // Register
  await request(app)
    .post("/auth/register")
    .send({
      firstName: "Upcoming",
      lastName: "Pick",
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

  // Create future event
  const eventResponse = await request(app)
    .post("/event")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      title: "Upcoming Gift Exchange",
      description: "Event has not started",
      participants: "John, Jane, Peter",
      startDate: "2026-12-20",
      deadline: "2026-12-25",
    });

  expect(eventResponse.status).toBe(201);

  const eventId = eventResponse.body.id;

  // Get Jane's participant ID
  const jane = await prismaClient.participant.findFirst({
    where: {
      eventId,
      name: "Jane",
    },
  });

  // Try to make a pick before the event starts
  const response = await request(app)
    .post(`/pick/make/${eventId}`)
    .send({
      pickerName: "John",
      pickedParticipantId: jane!.id,
      pickedName: "Jane",
    });

  expect(response.status).toBe(400);
  expect(response.body.message).toBe("Event has not started yet");
});
  it("should return 400 if the event has ended", async () => {
  const email = `make-pick-ended-${Date.now()}@gmail.com`;

  // Register
  await request(app)
    .post("/auth/register")
    .send({
      firstName: "Ended",
      lastName: "Pick",
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

  // Create an already-ended event
  const eventResponse = await request(app)
    .post("/event")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      title: "Ended Gift Exchange",
      description: "Event has ended",
      participants: "John, Jane, Peter",
      startDate: "2026-08-20",
      deadline: "2026-08-21",
    });

  expect(eventResponse.status).toBe(201);

  const eventId = eventResponse.body.id;

  const jane = await prismaClient.participant.findFirst({
    where: {
      eventId,
      name: "Jane",
    },
  });

  // Try to make a pick after the deadline
  const response = await request(app)
    .post(`/pick/make/${eventId}`)
    .send({
      pickerName: "John",
      pickedParticipantId: jane!.id,
      pickedName: "Jane",
    });

  expect(response.status).toBe(400);
  expect(response.body.message).toBe("Event has ended");
});
  it("should return 404 if the picker is not on the list", async () => {
  const email = `make-pick-not-found-${Date.now()}@gmail.com`;

  // Register
  await request(app)
    .post("/auth/register")
    .send({
      firstName: "Not",
      lastName: "Found",
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
      title: "Gift Exchange",
      description: "Test event",
      participants: "John, Jane, Peter",
      startDate: "2026-08-20",
      deadline: "2026-12-15",
    });

  expect(eventResponse.status).toBe(201);

  const eventId = eventResponse.body.id;

  const jane = await prismaClient.participant.findFirst({
    where: {
      eventId,
      name: "Jane",
    },
  });

  // David is NOT a participant
  const response = await request(app)
    .post(`/pick/make/${eventId}`)
    .send({
      pickerName: "David",
      pickedParticipantId: jane!.id,
      pickedName: "Jane",
    });

  expect(response.status).toBe(404);
  expect(response.body.message).toBe(
    "Your name is not on the list"
  );
});
  it("should return 400 if the picker has already picked", async () => {
  const email = `make-pick-already-${Date.now()}@gmail.com`;

  // Register
  await request(app)
    .post("/auth/register")
    .send({
      firstName: "Already",
      lastName: "Picked",
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
      title: "Gift Exchange",
      description: "Test event",
      participants: "John, Jane, Peter",
      startDate: "2026-08-20",
      deadline: "2026-12-15",
    });

  expect(eventResponse.status).toBe(201);

  const eventId = eventResponse.body.id;

  const john = await prismaClient.participant.findFirst({
    where: {
      eventId,
      name: "John",
    },
  });

  const jane = await prismaClient.participant.findFirst({
    where: {
      eventId,
      name: "Jane",
    },
  });

  // Create an existing pick for John
  await prismaClient.pick.create({
    data: {
      eventId,
      pickerName: john!.name,
      pickedParticipantId: jane!.id,
      pickedName: jane!.name,
    },
  });

  // John tries to pick again
  const response = await request(app)
    .post(`/pick/make/${eventId}`)
    .send({
      pickerName: "John",
      pickedParticipantId: jane!.id,
      pickedName: "Jane",
    });

  expect(response.status).toBe(400);
  expect(response.body.message).toBe("You already picked Jane");
});
  it("should return 404 if the picked participant does not exist", async () => {
  const email = `make-pick-participant-${Date.now()}@gmail.com`;

  // Register
  await request(app)
    .post("/auth/register")
    .send({
      firstName: "Participant",
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
      title: "Gift Exchange",
      description: "Test event",
      participants: "John, Jane, Peter",
      startDate: "2026-08-20",
      deadline: "2026-12-15",
    });

  expect(eventResponse.status).toBe(201);

  const eventId = eventResponse.body.id;

  // John exists, but participant ID 999999 does not
  const response = await request(app)
    .post(`/pick/make/${eventId}`)
    .send({
      pickerName: "John",
      pickedParticipantId: 999999,
      pickedName: "Jane",
    });

  expect(response.status).toBe(404);
  expect(response.body.message).toBe("Participant not found");
});
  it("should return 400 if the participant ID and name do not match", async () => {
  const email = `make-pick-mismatch-${Date.now()}@gmail.com`;

  // Register
  await request(app)
    .post("/auth/register")
    .send({
      firstName: "Mismatch",
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
      title: "Gift Exchange",
      description: "Test event",
      participants: "John, Jane, Peter",
      startDate: "2026-08-20",
      deadline: "2026-12-15",
    });

  expect(eventResponse.status).toBe(201);

  const eventId = eventResponse.body.id;

  // Get Jane
  const jane = await prismaClient.participant.findFirst({
    where: {
      eventId,
      name: "Jane",
    },
  });

  // Jane's ID, but Peter's name
  const response = await request(app)
    .post(`/pick/make/${eventId}`)
    .send({
      pickerName: "John",
      pickedParticipantId: jane!.id,
      pickedName: "Peter",
    });

  expect(response.status).toBe(400);
  expect(response.body.message).toBe(
    "Picked participant ID and name do not match"
  );
});
  it("should return 400 if the participant has already been picked", async () => {
  const email = `make-pick-taken-${Date.now()}@gmail.com`;

  // Register
  await request(app)
    .post("/auth/register")
    .send({
      firstName: "Taken",
      lastName: "Participant",
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
      title: "Gift Exchange",
      description: "Test event",
      participants: "John, Jane, Peter",
      startDate: "2026-08-20",
      deadline: "2026-12-15",
    });

  expect(eventResponse.status).toBe(201);

  const eventId = eventResponse.body.id;

  const jane = await prismaClient.participant.findFirst({
    where: {
      eventId,
      name: "Jane",
    },
  });

  // Mark Jane as already picked
  await prismaClient.participant.update({
    where: {
      id: jane!.id,
    },
    data: {
      isPicked: true,
    },
  });

  // John tries to pick Jane
  const response = await request(app)
    .post(`/pick/make/${eventId}`)
    .send({
      pickerName: "John",
      pickedParticipantId: jane!.id,
      pickedName: "Jane",
    });

  expect(response.status).toBe(400);
  expect(response.body.message).toBe(
    "This person has already been picked"
  );
});
  it("should return 400 if a participant tries to pick themselves", async () => {
  const email = `make-pick-self-${Date.now()}@gmail.com`;

  // Register
  await request(app)
    .post("/auth/register")
    .send({
      firstName: "Self",
      lastName: "Pick",
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
      title: "Gift Exchange",
      description: "Test event",
      participants: "John, Jane, Peter",
      startDate: "2026-08-20",
      deadline: "2026-12-15",
    });

  expect(eventResponse.status).toBe(201);

  const eventId = eventResponse.body.id;

  // Get John's participant record
  const john = await prismaClient.participant.findFirst({
    where: {
      eventId,
      name: "John",
    },
  });

  // John tries to pick himself
  const response = await request(app)
    .post(`/pick/make/${eventId}`)
    .send({
      pickerName: "John",
      pickedParticipantId: john!.id,
      pickedName: "John",
    });

  expect(response.status).toBe(400);
  expect(response.body.message).toBe(
    "You cannot pick yourself"
  );
});
});

describe("GET /pick/results/:eventId", () => {
  it("should return event results successfully", async () => {
    const email = `results-${Date.now()}@gmail.com`;

    // Register
    await request(app)
      .post("/auth/register")
      .send({
        firstName: "Results",
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

    // Get Jane
    const jane = await prismaClient.participant.findFirst({
      where: {
        eventId,
        name: "Jane",
      },
    });

    // Create a pick
    await prismaClient.pick.create({
      data: {
        eventId,
        pickerName: "John",
        pickedParticipantId: jane!.id,
        pickedName: "Jane",
      },
    });

    // Mark Jane as picked
    await prismaClient.participant.update({
      where: {
        id: jane!.id,
      },
      data: {
        isPicked: true,
      },
    });

    // Get results
    const response = await request(app)
      .get(`/pick/results/${eventId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);

    expect(response.body.eventTitle).toBe(
      "Christmas Gift Exchange"
    );

    expect(response.body.summary.totalParticipants).toBe(3);
    expect(response.body.summary.totalPicked).toBe(1);
    expect(response.body.summary.remaining).toBe(2);

    expect(response.body.picks).toHaveLength(1);
    expect(response.body.picks[0].pickerName).toBe("John");
    expect(response.body.picks[0].pickedName).toBe("Jane");

    expect(response.body.specialRequests).toBeDefined();
  });
  it("should return 404 if the event does not exist", async () => {
  const email = `results-not-found-${Date.now()}@gmail.com`;

  // Register
  await request(app)
    .post("/auth/register")
    .send({
      firstName: "Results",
      lastName: "NotFound",
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

  // Request a non-existent event
  const response = await request(app)
    .get("/pick/results/999999")
    .set("Authorization", `Bearer ${accessToken}`);

  expect(response.status).toBe(404);
  expect(response.body.message).toBe("Event not found");
});
  it("should return 401 if the user is not authenticated", async () => {
  const response = await request(app)
    .get("/pick/results/999999");

  expect(response.status).toBe(401);
});
  it("should return ongoing status for an active event", async () => {
  const email = `results-ongoing-${Date.now()}@gmail.com`;

  await request(app)
    .post("/auth/register")
    .send({
      firstName: "Ongoing",
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
      title: "Ongoing Event",
      description: "Testing status",
      participants: "John, Jane, Peter",
      startDate: "2026-08-20",
      deadline: "2026-12-15",
    });

  expect(eventResponse.status).toBe(201);

  const eventId = eventResponse.body.id;

  const response = await request(app)
    .get(`/pick/results/${eventId}`)
    .set("Authorization", `Bearer ${accessToken}`);

  expect(response.status).toBe(200);
  expect(response.body.status).toBe("ongoing");
});
  it("should return upcoming status for an event that has not started", async () => {
  const email = `results-upcoming-${Date.now()}@gmail.com`;

  // Register
  await request(app)
    .post("/auth/register")
    .send({
      firstName: "Upcoming",
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

  // Create future event
  const eventResponse = await request(app)
    .post("/event")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      title: "Upcoming Event",
      description: "Testing upcoming status",
      participants: "John, Jane, Peter",
      startDate: "2026-12-20",
      deadline: "2026-12-25",
    });

  expect(eventResponse.status).toBe(201);

  const eventId = eventResponse.body.id;

  // Get results
  const response = await request(app)
    .get(`/pick/results/${eventId}`)
    .set("Authorization", `Bearer ${accessToken}`);

  expect(response.status).toBe(200);
  expect(response.body.status).toBe("upcoming");
});
  it("should return completed status for an event that has ended", async () => {
  const email = `results-completed-${Date.now()}@gmail.com`;

  // Register
  await request(app)
    .post("/auth/register")
    .send({
      firstName: "Completed",
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

  // Create an event that has already ended
  const eventResponse = await request(app)
    .post("/event")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      title: "Completed Event",
      description: "Testing completed status",
      participants: "John, Jane, Peter",
      startDate: "2026-08-20",
      deadline: "2026-08-24",
    });

  expect(eventResponse.status).toBe(201);

  const eventId = eventResponse.body.id;

  // Get results
  const response = await request(app)
    .get(`/pick/results/${eventId}`)
    .set("Authorization", `Bearer ${accessToken}`);

  expect(response.status).toBe(200);
  expect(response.body.status).toBe("completed");
});

});