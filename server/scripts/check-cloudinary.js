import { v2 as cloudinary } from 'cloudinary';
import { config } from '../src/config.js';

const configured =
  config.cloudinary.cloudName &&
  config.cloudinary.apiKey &&
  config.cloudinary.apiSecret;

if (!configured) {
  console.log('Cloudinary: NOT configured in server/.env');
  process.exit(1);
}

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

try {
  const result = await cloudinary.api.ping();
  console.log('Cloudinary: CONNECTED');
  console.log('Cloud name:', config.cloudinary.cloudName);
  console.log('Status:', result.status);
} catch (err) {
  console.log('Cloudinary: FAILED');
  console.log(err.message);
  process.exit(1);
}
