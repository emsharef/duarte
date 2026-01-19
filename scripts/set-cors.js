const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3');

const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

async function setCors() {
    const command = new PutBucketCorsCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        CORSConfiguration: {
            CORSRules: [
                {
                    AllowedHeaders: ['*'],
                    AllowedMethods: ['PUT', 'GET', 'HEAD', 'POST', 'DELETE'],
                    AllowedOrigins: ['*'], // For development. In production, lock this down to the domain.
                    ExposeHeaders: ['ETag'],
                    MaxAgeSeconds: 3000,
                },
            ],
        },
    });

    try {
        await r2.send(command);
        console.log('CORS configuration set successfully');
    } catch (err) {
        console.error('Error setting CORS:', err);
    }
}

setCors();
