resource "azurerm_storage_account" "st_prod" {
  name                     = "stprodposcanada"
  resource_group_name      = azurerm_resource_group.rg_security.name
  location                 = azurerm_resource_group.rg_security.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  allow_nested_items_to_be_public  = true
  public_network_access_enabled    = true
  cross_tenant_replication_enabled = false

  network_rules {
    default_action = "Allow"
    bypass         = ["AzureServices"]
  }
}

# The private endpoint for blob storage
resource "azurerm_private_endpoint" "pe_storage_blob" {
  name                = "pe-storage-blob"
  location            = azurerm_resource_group.rg_security.location
  resource_group_name = azurerm_resource_group.rg_data.name
  subnet_id           = azurerm_subnet.subnet_pe.id

  private_service_connection {
    name                           = "pe-storage-blob-connection"
    private_connection_resource_id = azurerm_storage_account.st_prod.id
    is_manual_connection           = false
    subresource_names              = ["blob"]
  }
}
