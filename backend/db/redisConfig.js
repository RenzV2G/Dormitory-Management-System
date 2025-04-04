const Redis = require('ioredis');

const connectRedis = () => {
  const redisUri = process.env.REDIS_URI || "redis://localhost:6379"; // Fallback to local
  const redisClient = new Redis(redisUri);

  redisClient.on("connect", () => {
      console.log(`Connected to Redis successfully at redis://localhost:6379`);
  });

  redisClient.on("error", (err) => {
      console.error("Redis connection error:", err);
  });

  return redisClient;
};

module.exports = connectRedis;
