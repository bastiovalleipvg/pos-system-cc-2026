const { SecretClient } = require("@azure/keyvault-secrets");
const { DefaultAzureCredential } = require("@azure/identity");

async function loadSecrets(){
    // Si estamos en local (desarrollo), usamos el archivo .env normal
    if (process.env.NODE_ENV !== 'production') {
        return;
    }

    // Si estamos en producción (Azure), vamos a buscar la contraseña al Key Vault
    console.log("Conectando a Azure Key Vault...");
    const vaultName = process.env.KEY_VAULT_NAME; // ej: kv-pos-equipoX-2026
    const url = `https://${vaultName}.vault.azure.net`;

    const credential = new DefaultAzureCredential();
    const client = new SecretClient(url, credential);

    try {
        // Obtenemos el secreto que creamos manualmente en el portal
        const dbPassword = await client.getSecret("DB-PASSWORD");

        // Inyectamos la contraseña en la memoria del programa de forma segura
        process.env.DB_PASSWORD = dbPassword.value;
        console.log("Secretos cargados exitosamente desde Key Vault");
    } catch (error) {
        console.error("Error al cargar secretos de Key Vault", error);
    }
}

module.exports = loadSecrets;
