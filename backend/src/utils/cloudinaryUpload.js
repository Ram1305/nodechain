const { cloudinary, isCloudinaryConfigured, folder } = require('../config/cloudinary');

function uploadBuffer(file, subfolder = 'misc') {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }
    if (!isCloudinaryConfigured()) {
      reject(new Error('Cloudinary is not configured. Set CLOUDINARY_* in .env'));
      return;
    }

    const resourceType = file.mimetype?.startsWith('video/')
      ? 'video'
      : file.mimetype?.startsWith('audio/')
        ? 'video'
        : 'image';

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${folder}/${subfolder}`,
        resource_type: resourceType,
        public_id: undefined,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );
    stream.end(file.buffer);
  });
}

async function uploadMany(files, subfolder = 'misc') {
  if (!files || !files.length) return [];
  const urls = [];
  for (const file of files) {
    const url = await uploadBuffer(file, subfolder);
    if (url) urls.push(url);
  }
  return urls;
}

module.exports = { uploadBuffer, uploadMany };
