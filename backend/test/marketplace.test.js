const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../server");
const { BUYER } = require("../data/seedData");

test("GET /health returns ok", async () => {
  const response = await request(app).get("/health");
  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ok");
});

test("GET /api/v1/nfts returns seed data", async () => {
  const response = await request(app).get("/api/v1/nfts");
  assert.equal(response.status, 200);
  assert.equal(response.body.nfts.length, 10);
});

// --- Core (must implement for 60-min assessment) ---
test("should return 404 for nonexistent NFT history", async () => {
  const response = await request(app).get("/api/v1/nfts/999/history");
  assert.equal(response.status, 404);
  assert.equal(response.body.error, true);
});

test("should return 400 for bid lower than current highest", async () => {
  const lowBid = {
    bidder: "0xfeed000000000000000000000000000000000000",
    amount: "0.0001",
  };
  const response = await request(app)
    .post("/api/v1/nfts/1/bid")
    .send(lowBid)
    .set("Content-Type", "application/json");
  assert.equal(response.status, 400);
  assert.equal(response.body.error, true);
});

test("GET /api/v1/transactions/user/:address returns paginated data", async () => {
  const response = await request(app).get(`/api/v1/transactions/user/${BUYER}`);
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body.transactions));
});

// --- Optional ---
test("should handle malformed request body gracefully", async () => {
  const response = await request(app)
    .post("/api/v1/nfts/1/bid")
    .send({})
    .set("Content-Type", "application/json");
  assert.equal(response.status, 400);
  assert.equal(response.body.error, true);
  assert.equal(response.body.message, "Invalid bidder");
});
