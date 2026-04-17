let client = null;
let mode = "memory";
let memoryStore = new Map();

function buildRedisOptions() {
  const url = process.env.REDIS_URL;
  const connectTimeout = parseInt(process.env.REDIS_CONNECT_TIMEOUT_MS || "10000", 10);
  if (url) {
    const isTls = /^rediss:\/\//i.test(url);
    return { url, isTls, connectTimeout };
  }
  const host = process.env.REDIS_HOST || "127.0.0.1";
  const port = parseInt(process.env.REDIS_PORT || "6379", 10);
  const username = process.env.REDIS_USERNAME || undefined;
  const password = process.env.REDIS_PASSWORD || undefined;
  const isTls = process.env.REDIS_TLS === "true";
  return { host, port, username, password, isTls, connectTimeout };
}

async function init() {
  const cfg = buildRedisOptions();
  // Prefer ioredis for robust TLS handling
  try {
    const Redis = require("ioredis");
    const common = {
      maxRetriesPerRequest: 1,
      connectTimeout: cfg.connectTimeout,
      enableReadyCheck: true,
      retryStrategy: (times) => Math.min(1000, times * 50)
    };
    client = cfg.url
      ? new Redis(cfg.url, { ...common, tls: cfg.isTls ? {} : undefined })
      : new Redis({
          host: cfg.host,
          port: cfg.port,
          username: cfg.username,
          password: cfg.password,
          tls: cfg.isTls ? {} : undefined,
          ...common
        });
    mode = "ioredis";
    client.on("connect", () => console.info("[Redis] ioredis connect"));
    client.on("ready", () => console.info("[Redis] ioredis ready"));
    client.on("reconnecting", () => console.warn("[Redis] ioredis reconnecting"));
    client.on("end", () => console.warn("[Redis] ioredis end"));
    client.on("error", (e) => console.warn("[Redis] ioredis error:", e && e.message ? e.message : e));
    try { await client.ping(); } catch (_) {}
    return;
  } catch (e) {
    // fallthrough to node-redis
  }
  try {
    const { createClient } = require("redis");
    const socket = cfg.url
      ? { tls: cfg.isTls ? true : undefined, connectTimeout: cfg.connectTimeout, reconnectStrategy: (retries) => Math.min(1000, retries * 50) }
      : { host: cfg.host, port: cfg.port, tls: cfg.isTls ? true : undefined, connectTimeout: cfg.connectTimeout, reconnectStrategy: (retries) => Math.min(1000, retries * 50) };
    client = cfg.url
      ? createClient({ url: cfg.url, socket })
      : createClient({ socket, username: cfg.username, password: cfg.password });
    client.on("connect", () => console.info("[Redis] node-redis connect"));
    client.on("ready", () => console.info("[Redis] node-redis ready"));
    client.on("reconnecting", () => console.warn("[Redis] node-redis reconnecting"));
    client.on("end", () => console.warn("[Redis] node-redis end"));
    client.on("error", (e) => console.warn("[Redis] node-redis error:", e && e.message ? e.message : e));
    await client.connect();
    mode = "node-redis";
    // Warmup ping
    try { await client.ping(); } catch (_) {}
    return;
  } catch (e) {
    console.warn("[Redis] No redis client installed. Falling back to in-memory store (dev only).", e && e.message ? e.message : e);
    mode = "memory";
    client = null;
  }
}

function now() { return Date.now(); }

function memGetEntry(key) {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt <= now()) {
    memoryStore.delete(key);
    return null;
  }
  return entry;
}

const api = {
  get mode() { return mode; },
  async waitUntilReady(timeoutMs = 10000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        if (mode === "ioredis") {
          const status = client?.status;
          if (status === "ready") return true;
        } else if (mode === "node-redis") {
          if (client?.isOpen) return true;
        } else {
          return true; // memory mode is always ready
        }
        await new Promise(r => setTimeout(r, 50));
      } catch (_) { await new Promise(r => setTimeout(r, 50)); }
    }
    return false;
  },
  async ping() {
    try {
      if (mode === "ioredis") return await client.ping();
      if (mode === "node-redis") return await client.ping();
      return "PONG";
    } catch (e) {
      return null;
    }
  },
  async incr(key) {
    if (mode === "ioredis") {
      return await client.incr(key);
    } else if (mode === "node-redis") {
      return await client.incr(key);
    } else {
      const entry = memGetEntry(key) || { value: 0, expiresAt: 0 };
      entry.value += 1;
      memoryStore.set(key, entry);
      return entry.value;
    }
  },
  async expire(key, seconds) {
    if (mode === "ioredis") {
      return await client.expire(key, seconds);
    } else if (mode === "node-redis") {
      return await client.expire(key, seconds);
    } else {
      const entry = memGetEntry(key) || { value: 0 };
      entry.expiresAt = now() + seconds * 1000;
      memoryStore.set(key, entry);
      return true;
    }
  },
  async ttl(key) {
    if (mode === "ioredis") {
      const t = await client.ttl(key);
      return t;
    } else if (mode === "node-redis") {
      const t = await client.ttl(key);
      return t;
    } else {
      const entry = memGetEntry(key);
      if (!entry || !entry.expiresAt) return -1;
      const ms = entry.expiresAt - now();
      return ms <= 0 ? -1 : Math.ceil(ms / 1000);
    }
  },
  async get(key) {
    if (mode === "ioredis") {
      return await client.get(key);
    } else if (mode === "node-redis") {
      return await client.get(key);
    } else {
      const entry = memGetEntry(key);
      if (!entry) return null;
      return String(entry.value);
    }
  },
  async setEx(key, seconds, value, { nx = false } = {}) {
    if (mode === "ioredis") {
      if (nx) return await client.set(key, value, "EX", seconds, "NX");
      return await client.setex(key, seconds, value);
    } else if (mode === "node-redis") {
      const opts = nx ? { EX: seconds, NX: true } : { EX: seconds };
      return await client.set(key, value, opts);
    } else {
      const exists = !!memGetEntry(key);
      if (nx && exists) return null;
      memoryStore.set(key, { value, expiresAt: now() + seconds * 1000 });
      return "OK";
    }
  }
};

// initialize on import
init();

module.exports = api;
