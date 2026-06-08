const multer = require('multer');
const { MulterAzureStorage } = require('multer-azure-blob-storage');
const path = require('path');

const resolveBlobName = (_req, file) => {
  return new Promise((resolve) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    resolve(uniqueName);
  });
};

const storage = new MulterAzureStorage({
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  containerName: process.env.AZURE_CONTAINER_NAME,
  blobName: resolveBlobName,
  containerAccessLevel: 'blob', // 'blob' permite acceso público de lectura anónima
});

const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const isValid = allowed.test(path.extname(file.originalname).toLowerCase()) &&
                  allowed.test(file.mimetype);
  isValid ? cb(null, true) : cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

module.exports = upload;
