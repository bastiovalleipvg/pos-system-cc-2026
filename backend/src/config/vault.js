'use strict';

const { SecretClient } = require('@azure/keyvault-secrets');
const { DefaultAzureCredential } = require('@azure/identity');

/**
 * Mapa de nombres de secretos en Azure Key Vault → variables de entorno Node.js.
 * Convención: guión en Azure, guión_bajo en process.env.
 */
const SECRET_MAP = {
  'DB-USER':       'DB_USER',
  'DB-PASSWORD':   'DB_PASSWORD',
  'REDIS-PASSWORD': 'REDIS_PASSWORD',
  'JWT-SECRET':    'JWT_SECRET',
};

/**
 * Carga todos los secretos desde Azure Key Vault e inyecta sus valores
 * en process.env antes de que el servidor arranque.
 *
 * - En desarrollo (NODE_ENV !== 'production') simplemente retorna;
 *   los valores ya deben estar en el archivo .env local.
 * - En producción, cualquier error es FATAL: lanza una excepción que
 *   detiene el proceso. Cero fallbacks, cero valores por defecto.
 */
async function loadSecrets() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Vault] Entorno de desarrollo — usando variables de .env local.');
    return;
  }

  const vaultName = process.env.KEY_VAULT_NAME;
  if (!vaultName) {
    throw new Error(
      '[Vault] FATAL: La variable de entorno KEY_VAULT_NAME no está definida. ' +
      'El servicio no puede arrancar sin acceso a Key Vault.'
    );
  }

  const vaultUrl = `https://${vaultName}.vault.azure.net`;
  console.log(`[Vault] Conectando a Azure Key Vault: ${vaultUrl}`);

  let credential;
  try {
    credential = new DefaultAzureCredential();
  } catch (err) {
    throw new Error(
      `[Vault] FATAL: No se pudo crear DefaultAzureCredential. ` +
      `Verifica que la Managed Identity esté habilitada. Detalle: ${err.message}`
    );
  }

  const client = new SecretClient(vaultUrl, credential);

  // Descarga todos los secretos de forma concurrente.
  const secretNames = Object.keys(SECRET_MAP);
  let results;
  try {
    results = await Promise.all(
      secretNames.map((name) => client.getSecret(name))
    );
  } catch (err) {
    throw new Error(
      `[Vault] FATAL: Error al obtener secretos de Key Vault "${vaultName}". ` +
      `Verifica conectividad, permisos (Key Vault Secrets User) y nombres de secretos. ` +
      `Detalle: ${err.message}`
    );
  }

  // Inyecta cada secreto en process.env y valida que no esté vacío.
  secretNames.forEach((secretName, index) => {
    const envKey = SECRET_MAP[secretName];
    const value  = results[index].value;

    if (!value) {
      throw new Error(
        `[Vault] FATAL: El secreto "${secretName}" existe en Key Vault pero su valor está vacío. ` +
        `El servicio no puede arrancar con credenciales incompletas.`
      );
    }

    process.env[envKey] = value;
  });

  console.log(
    `[Vault] ✅ ${secretNames.length} secretos cargados exitosamente: ` +
    `${secretNames.join(', ')}`
  );
}

module.exports = loadSecrets;
