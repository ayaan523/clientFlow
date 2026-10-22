import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
process.env.NODE_ENV = "test";
const { app } = await import("../src/server.js");
test("health endpoint is public", async () => {
  const response = await request(app).get("/api/v1/health");
  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ok");
});
test("protected client route rejects anonymous requests", async () => {
  const response = await request(app).get("/api/v1/clients");
  assert.equal(response.status, 401);
});
test("unknown routes are handled consistently", async () => {
  const response = await request(app).get("/unknown");
  assert.equal(response.status, 404);
});
