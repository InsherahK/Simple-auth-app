// backend/middlewares/uploadMiddleware.js
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client,} = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const s3 = require('../config/wasabiConfig');

// Create S3 client
const s3Client = new S3Client({
    region: process.env.WASABI_REGION,
    credentials: {
        accessKeyId: process.env.WASABI_ACCESS_KEY_ID,
        secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY,
    },
});


const upload = multer({
    storage: multerS3({
        s3: s3Client,
        bucket: process.env.WASABI_BUCKET_NAME,
        acl: 'public-read',
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            cb(null, Date.now().toString() + '-' + file.originalname);
        },
    }),
});

module.exports = upload;
