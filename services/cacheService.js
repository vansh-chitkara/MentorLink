const Redis = require("ioredis");

const cache = new Map();

let redisClient = null;
if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
  });

  redisClient.on("error", () => {
    // Fallback to in-memory cache if Redis is unavailable
    redisClient = null;
  });
}

const setCache = async (key, value, ttlSeconds = 60) => {
  const payload = JSON.stringify(value);
  if (redisClient) {
    await redisClient.set(key, payload, "EX", ttlSeconds);
    return;
  }

  const expiresAt = Date.now() + ttlSeconds * 1000;
  cache.set(key, { value: payload, expiresAt });
};

const getCache = async (key) => {
  if (redisClient) {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  }

  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return JSON.parse(entry.value);
};

module.exports = {
  setCache,
  getCache,
};
