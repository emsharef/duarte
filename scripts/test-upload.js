const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

async function testUpload() {
    const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: 'test-upload.txt',
        Body: 'Hello R2',
        ContentType: 'text/plain',
    });

    try {
        await r2.send(command);
        console.log('Upload successful');
    } catch (err) {
        console.error('Upload failed:', err);
    }
}

testUpload();
