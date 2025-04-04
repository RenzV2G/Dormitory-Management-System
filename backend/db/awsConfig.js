const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');

// Ensure the bucket name is set
const bucketName = process.env.AWS_S3_BUCKET_NAME;
if (!bucketName) {
  throw new Error('AWS_S3_BUCKET_NAME is required in environment variables');
}

// ✅ Initialize S3 Client (AWS SDK v3)
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function testS3Connection() {
  try {
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    console.log("✅ Successfully connected to S3!");
    console.log("📂 Available Buckets:", response.Buckets.map(bucket => bucket.Name));
  } catch (error) {
    console.error("❌ Error connecting to S3:", error.message);
  }
}

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
    cb(null, true); 
  } else {
    cb(new Error('Only PNG and JPEG files are allowed'), false);
  }
};

const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: bucketName,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const filename = `uploads/${uniqueSuffix}-${file.originalname}`;
      cb(null, filename);
    },
  }),
  fileFilter: fileFilter, 
  limits: { fileSize: 5 * 1024 * 1024 }, 
});

testS3Connection();

module.exports = { s3Client, upload };
