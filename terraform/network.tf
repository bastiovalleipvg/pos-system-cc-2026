resource "azurerm_virtual_network" "vnet_pos" {
  name                = "vnet-prod-pos"
  location            = azurerm_resource_group.rg_network.location
  resource_group_name = azurerm_resource_group.rg_network.name
  address_space       = ["10.0.0.0/16"]
}

resource "azurerm_subnet" "subnet_appgw" {
  name                 = "subnet-appgw"
  resource_group_name  = azurerm_resource_group.rg_network.name
  virtual_network_name = azurerm_virtual_network.vnet_pos.name
  address_prefixes     = ["10.0.1.0/24"]
}

resource "azurerm_subnet" "subnet_redis" {
  name                 = "subnet-redis"
  resource_group_name  = azurerm_resource_group.rg_network.name
  virtual_network_name = azurerm_virtual_network.vnet_pos.name
  address_prefixes     = ["10.0.5.0/24"]
  default_outbound_access_enabled = false
}

resource "azurerm_subnet" "subnet_pe" {
  name                 = "subnet-private-endpoint"
  resource_group_name  = azurerm_resource_group.rg_network.name
  virtual_network_name = azurerm_virtual_network.vnet_pos.name
  address_prefixes     = ["10.0.6.0/24"]
  default_outbound_access_enabled = false
}

resource "azurerm_subnet" "subnet_fw" {
  name                 = "AzureFirewallSubnet"
  resource_group_name  = azurerm_resource_group.rg_network.name
  virtual_network_name = azurerm_virtual_network.vnet_pos.name
  address_prefixes     = ["10.0.7.0/26"]
}

resource "azurerm_subnet" "subnet_aca" {
  name                 = "subnet-containerapps"
  resource_group_name  = azurerm_resource_group.rg_network.name
  virtual_network_name = azurerm_virtual_network.vnet_pos.name
  address_prefixes     = ["10.0.2.0/23"]
  default_outbound_access_enabled = false

  delegation {
    name = "Microsoft.App.environments"
    service_delegation {
      name    = "Microsoft.App/environments"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}


resource "azurerm_subnet" "subnet_postgres" {
  name                 = "subnet-postgres"
  resource_group_name  = azurerm_resource_group.rg_network.name
  virtual_network_name = azurerm_virtual_network.vnet_pos.name
  address_prefixes     = ["10.0.4.0/24"]
  default_outbound_access_enabled = false
  service_endpoints    = ["Microsoft.Storage"]

  delegation {
    name = "dlg-Microsoft.DBforPostgreSQL-flexibleServers"
    service_delegation {
      name    = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}

# Network Security Groups (NSGs)
resource "azurerm_network_security_group" "nsg_appgw" {
  name                = "nsg-prod-appgw"
  location            = azurerm_resource_group.rg_network.location
  resource_group_name = azurerm_resource_group.rg_network.name
}

resource "azurerm_network_security_group" "nsg_redis" {
  name                = "nsg-prod-redis"
  location            = azurerm_resource_group.rg_network.location
  resource_group_name = azurerm_resource_group.rg_network.name
}

resource "azurerm_network_security_group" "nsg_aca" {
  name                = "nsg-prod-containerapps"
  location            = azurerm_resource_group.rg_network.location
  resource_group_name = azurerm_resource_group.rg_network.name
}

resource "azurerm_network_security_group" "nsg_postgres" {
  name                = "nsg-prod-postgres"
  location            = azurerm_resource_group.rg_network.location
  resource_group_name = azurerm_resource_group.rg_network.name
}

# NSG Associations
resource "azurerm_subnet_network_security_group_association" "nsg_appgw_assoc" {
  subnet_id                 = azurerm_subnet.subnet_appgw.id
  network_security_group_id = azurerm_network_security_group.nsg_appgw.id
}

resource "azurerm_subnet_network_security_group_association" "nsg_redis_assoc" {
  subnet_id                 = azurerm_subnet.subnet_redis.id
  network_security_group_id = azurerm_network_security_group.nsg_redis.id
}

resource "azurerm_subnet_network_security_group_association" "nsg_aca_assoc" {
  subnet_id                 = azurerm_subnet.subnet_aca.id
  network_security_group_id = azurerm_network_security_group.nsg_aca.id
}



resource "azurerm_subnet_network_security_group_association" "nsg_postgres_assoc" {
  subnet_id                 = azurerm_subnet.subnet_postgres.id
  network_security_group_id = azurerm_network_security_group.nsg_postgres.id
}
