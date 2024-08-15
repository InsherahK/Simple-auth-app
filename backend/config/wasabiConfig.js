// backend/wasabiConfig.js
const { S3Client } = require("@aws-sdk/client-s3");
console.log("Region from .env:", process.env.WASABI_REGION);
console.log("Endpoint from .env:", process.env.WASABI_ENDPOINT);


const s3 = new S3Client({
  region: process.env.WASABI_REGION,
  endpoint: `https://${process.env.WASABI_ENDPOINT}`,
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY_ID,
    secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY,
  },
});
//console.log("S3 Client Config:", s3.config);
module.exports = s3;
