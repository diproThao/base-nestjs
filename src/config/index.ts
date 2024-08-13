export default () => ({
  appEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3210,
  database: {
    url: process.env.DB_URL,
    synDB: process.env.SYNC_DB == '1',
  },
  jwt: {
    secret: process.env.JWT_SECRET_KEY,
    expireTime: process.env.EXPIRE_TIME,
    rfExpireTime: process.env.RF_EXPIRE_TIME,
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    bucket: process.env.S3_BUCKET,
    region: process.env.AWS_REGION,
  },
});
