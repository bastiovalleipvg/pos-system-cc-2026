data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "kv_pos" {
  name                       = "kv-prod-pos-core"
  location                   = azurerm_resource_group.rg_security.location
  resource_group_name        = azurerm_resource_group.rg_security.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 90
  purge_protection_enabled   = false
  enable_rbac_authorization  = true
  public_network_access_enabled = true

  network_acls {
    default_action = "Deny"
    bypass         = "AzureServices"
    ip_rules       = ["186.11.57.24/32"]
  }
}

# Private Endpoint for Key Vault
resource "azurerm_private_endpoint" "pe_kv" {
  name                = "pe-kv-prod-core"
  location            = azurerm_resource_group.rg_security.location
  resource_group_name = azurerm_resource_group.rg_security.name
  subnet_id           = azurerm_subnet.subnet_pe.id

  private_service_connection {
    name                           = "pe-kv-prod-core"
    private_connection_resource_id = azurerm_key_vault.kv_pos.id
    is_manual_connection           = false
    subresource_names              = ["vault"]
  }
}

# Role Assignments will be declared in compute.tf or here depending on the Identity.
# Assuming we will use SystemAssigned Identity of Container Apps to access the Key Vault.
