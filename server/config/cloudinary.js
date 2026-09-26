const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

const uploadImageToCloudinary = async (fileBuffer, fileName = 'food_item') => {
  try {
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'hungerlink_donations', public_id: `${fileName}_${Date.now()}` },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
        stream.end(fileBuffer);
      });
    } else {
      // Base64 Fallback when Cloudinary credentials are not set
      const base64 = fileBuffer.toString('base64');
      return `data:image/jpeg;base64,${base64}`;
    }
  } catch (err) {
    console.error('Cloudinary upload error:', err.message);
    throw err;
  }
};

module.exports = { cloudinary, uploadImageToCloudinary };
