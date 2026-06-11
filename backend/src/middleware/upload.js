'use strict';

/**
 * Middleware de carga de imágenes — Multer + Azure Blob Storage.
 *
 * Sube las imágenes directamente al contenedor de Azure Blob Storage
 * configurado en la cuenta 'stprodposcanada' a través del Private Endpoint
 * 'pe-storage-blob'. No se almacena nada en disco local (efímero en contenedores).
 *
 * La connection string se obtiene de Azure Key Vault vía vault.js:
 *   Secreto: AZURE-STORAGE-CONNECTION-STRING → process.env.AZURE_STORAGE_CONNECTION_STRING
 *
 * Requiere las siguientes variables de entorno:
 *   AZURE_STORAGE_CONNECTION_STRING — Cadena de conexión de la cuenta de almacenamiento.
 *   AZURE_CONTAINER_NAME            — Nombre del contenedor de blobs (ej: "product-images").
 */

const multer = require('multer');
const { MulterAzureStorage } = require('multer-azure-blob-storage');
const path = require('path');
const logger = require('../config/logger');

/**
 * Genera un nombre de blob único para evitar colisiones.
 * Formato: <timestamp>-<random>.<extension>
 */
const resolveBlobName = (_req, file) => {
  return new Promise((resolve) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    resolve(uniqueName);
  });
};

const azureStorage = new MulterAzureStorage({
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  containerName:    process.env.AZURE_CONTAINER_NAME || 'product-images',
  blobName:         resolveBlobName,
  containerAccessLevel: 'blob', // Acceso público de lectura anónima (solo blobs)
});

/**
 * Filtro de tipos de archivo.
 * Solo permite imágenes con extensiones y MIME types válidos.
 */
const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const extValid  = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeValid = allowed.test(file.mimetype);

  if (extValid && mimeValid) {
    cb(null, true);
  } else {
    logger.warn(`[Upload] Archivo rechazado: ${file.originalname} (MIME: ${file.mimetype})`);
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: azureStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB máximo por imagen
  },
});

module.exports = upload;
