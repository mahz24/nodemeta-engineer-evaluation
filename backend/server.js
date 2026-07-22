const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const { baseNfts, baseTransactions } = require("./data/seedData");

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;
const corsOrigin = process.env.CORS_ORIGIN || "*";

app.use(morgan("dev"));
app.use(express.json());
app.use(
  cors({
    origin: corsOrigin === "*" ? true : corsOrigin,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Origin", "Content-Type", "Accept", "Authorization"],
  }),
);

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function findNft(id) {
  return baseNfts.find((nft) => nft.id === id);
}

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "NodeMeta Marketplace API is running",
    version: "1.0.0",
    chain: "BNB Smart Chain Testnet",
  });
});

app.get("/api/v1/nfts", (req, res) => {
  const page = Number.parseInt(req.query.page || "1", 10);
  const limit = Number.parseInt(req.query.limit || "10", 10);
  res.json({
    nfts: baseNfts.map(({ history, ...nft }) => nft),
    total: baseNfts.length,
    page,
    limit,
    totalPages: 1,
  });
});

app.get("/api/v1/nfts/marketplace/listings", (_req, res) => {
  res.json(
    baseNfts.filter((nft) => nft.isListed).map(({ history, ...nft }) => nft),
  );
});

app.get("/api/v1/nfts/:id/metadata", (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: true, message: "Invalid NFT ID" });
  }
  const nft = findNft(id);
  if (!nft) {
    return res.status(404).json({ error: true, message: "NFT not found" });
  }
  return res.json({
    name: nft.name,
    description: nft.description,
    image: nft.imageUrl,
    external_url: `https://nodemeta.com/nft/${id}`,
    attributes: [
      { trait_type: "Rarity", value: "Legendary" },
      { trait_type: "Chain", value: "BSC Testnet" },
      { trait_type: "Collection", value: "NodeMeta" },
    ],
  });
});

app.get("/api/v1/nfts/:id", (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: true, message: "Invalid NFT ID" });
  }
  const nft = findNft(id);
  if (!nft) {
    return res.status(404).json({ error: true, message: "NFT not found" });
  }
  const { history, ...publicNft } = nft;
  return res.json(publicNft);
});

// TODO: Candidate implements — return transfer/listing history for this NFT, sorted newest-first, 404 if not found
app.get("/api/v1/nfts/:id/history", (_req, res) => {
  const id = parseId(_req.params.id);
  if (!id) {
    return res.status(400).json({ error: true, message: "Invalid NFT ID" });
  }
  const nft = findNft(id);
  if (!nft) {
    return res.status(404).json({ error: true, message: "NFT not found" });
  }
  const history = Array.isArray(nft.history)
    ? [...nft.history].sort((a, b) => b.timestamp - a.timestamp)
    : [];
  return res.json({ history });
});

// TODO: Candidate implements — validate bid amount > current highest bid, reject with 400 if too low, record bid and return updated listing
app.post("/api/v1/nfts/:id/bid", (_req, res) => {
  const id = parseId(_req.params.id);
  if (!id) {
    return res.status(400).json({ error: true, message: "Invalid NFT ID" });
  }
  const nft = findNft(id);
  if (!nft) {
    return res.status(404).json({ error: true, message: "NFT not found" });
  }
  const { bidder, amount } = _req.body || {};
  if (!bidder || typeof bidder !== "string") {
    return res.status(400).json({ error: true, message: "Invalid bidder" });
  }
  const amountNum = Number(amount);
  if (Number.isNaN(amountNum) || amountNum <= 0) {
    return res.status(400).json({ error: true, message: "Invalid amount" });
  }

  // Determine current highest bid (from history bids) or listing price if none
  const bidPrices = (nft.history || [])
    .filter((h) => h.type === "bid")
    .map((h) => Number(h.price))
    .filter((p) => !Number.isNaN(p));
  const currentHighest = bidPrices.length
    ? Math.max(...bidPrices)
    : Number(nft.price || 0);
  if (amountNum <= currentHighest) {
    return res
      .status(400)
      .json({
        error: true,
        message: "Bid must be higher than current highest bid",
      });
  }

  const nextId =
    (nft.history || []).reduce((m, h) => Math.max(m, h.id || 0), 0) + 1;
  const newBid = {
    id: nextId,
    type: "bid",
    from: bidder,
    to: nft.owner,
    price: String(amountNum),
    txHash: `0x${Date.now().toString(16)}${Math.floor(Math.random() * 1e6).toString(16)}`,
    timestamp: Math.floor(Date.now() / 1000),
  };
  nft.history = nft.history || [];
  nft.history.push(newBid);

  // Return updated listing (including history)
  const { history, ...updated } = nft;
  return res.json(nft);
});

// TODO: Candidate implements — return all transactions for this wallet address, support pagination with ?page=1&limit=10 query params
app.get("/api/v1/transactions/user/:address", (_req, res) => {
  const address = _req.params.address;
  if (!address || typeof address !== "string") {
    return res.status(400).json({ error: true, message: "Invalid address" });
  }
  const page = Number.parseInt(_req.query.page || "1", 10) || 1;
  const limit = Number.parseInt(_req.query.limit || "10", 10) || 10;
  const filtered = baseTransactions.filter(
    (tx) => tx.from === address || tx.to === address,
  );
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);
  return res.json({ transactions: paginated, total, page, limit, totalPages });
});

app.get("/api/v1/transactions", (req, res) => {
  const page = Number.parseInt(req.query.page || "1", 10);
  const limit = Number.parseInt(req.query.limit || "10", 10);
  return res.json({
    transactions: baseTransactions,
    total: baseTransactions.length,
    page,
    limit,
    totalPages: 1,
  });
});

app.get("/api/v1/transactions/:id", (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res
      .status(400)
      .json({ error: true, message: "Invalid transaction ID" });
  }
  const transaction = baseTransactions.find((tx) => tx.id === id);
  if (!transaction) {
    return res
      .status(404)
      .json({ error: true, message: "Transaction not found" });
  }
  return res.json(transaction);
});

app.use((err, _req, res, _next) => {
  res.status(err.status || 500).json({
    error: true,
    message: err.message || "Internal server error",
  });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`🚀 NodeMeta backend starting on port ${port}`);
  });
}

module.exports = app;
