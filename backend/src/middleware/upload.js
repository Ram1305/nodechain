const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
});

/** Accept all Flutter multipart field names */
const anyUpload = upload.any();

function uploadMiddleware(req, res, next) {
  anyUpload(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        status: false,
        message: err.message || 'Upload failed',
        data: null,
      });
    }
    return next();
  });
}

function filesByField(req, fieldName) {
  if (!req.files || !Array.isArray(req.files)) return [];
  return req.files.filter((f) => f.fieldname === fieldName || f.fieldname === `${fieldName}[]`);
}

function firstFile(req, fieldName) {
  const files = filesByField(req, fieldName);
  return files[0] || null;
}

module.exports = { uploadMiddleware, filesByField, firstFile };
