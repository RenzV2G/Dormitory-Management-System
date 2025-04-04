require('dotenv').config();

const Express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const compression = require('compression');
const cron = require('node-cron');

mongoose.set('strictQuery', false);


const app = Express(); 

// Import AWS configuration
const { upload } = require('./db/awsConfig');

// AWS S3 middleware
app.use((req, res, next) => {
  req.upload = upload;
  next();
});

// CORS here
app.use(cors(
  {
    origin: ["http://localhost:4200"], //"https://dorm-hau.com"
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', 
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type'],
  }
));

// Compression  
app.use(
  compression({
    threshold: 2000, 
    filter: (req, res) => {
      console.log(`Compression applied for ${req.url}`);
      return compression.filter(req, res);
    },
  })
);

app.use(Express.json());
app.use(Express.urlencoded({extended: true}));



var port = process.env.PORT || 3000
app.listen(port, () =>{
  console.log(`Server is running at http://localhost:${port}`);
});


// Database Connection
const connectDB = require('./db/config');
connectDB();

// Redis Connection
const connectRedis = require("./db/redisConfig");

(async () => {
  try {
    const redisClient = await connectRedis(); // Wait for Redis to connect

    app.use((req, res, next) => {
      req.redis = redisClient;
      next();
    });

    // Initiate Routes after Redis is ready
    const authRoutes = require('./routes/routes');

    // Router
    app.use(authRoutes);

    // Node-cron for automation of expired form-queue deadlines delete
    const { triggerAutoDeleteExpiredForms } = require('./controllers/autoDeleteController');

    // set to 0 0 * * 0 when deployment to check every sunday at midnight, * * * * * for 1 minute test */3 * * * * for the defense
    cron.schedule('0 0 * * 0', async () => {
      console.log('Running Screening deadline check...');

      try {
        if (!redisClient.status || redisClient.status !== "ready") {
          console.error('Redis client is not connected.');
          return;
        }

        const mockReq = { redis: redisClient };
        const mockRes = {
          status: (code) => ({
            json: (data) => console.log(`Status: ${code}`, data),
          }),
        };

        await triggerAutoDeleteExpiredForms(mockReq, mockRes);
        console.log("Auto-delete process completed.");
      } catch (error) {
        console.error("Error in auto-delete cron job:", error.message);
      }
    });

  } catch (error) {
    console.error("Failed to connect to Redis:", error.message);
  }
})();

// Root route
app.get('/', (req, res) => {
  res.send(`
    <div style="
      font-family: Arial, sans-serif;
      background-color: #4CAF50;
      padding: 30px;
      font-size: 24px;
      font-weight: bold;
    ">
      API is working!
    </div>
  `);
});


