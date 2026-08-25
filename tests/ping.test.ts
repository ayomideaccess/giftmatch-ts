import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../src/app.js";

describe("GET /ping", () => {
  it("should return pong", async () => {
    const response = await request(app).get("/ping");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("pong");
    console.log(response.body);
  });
});
