resource "azurerm_resource_group" "rg_apps" {
  name     = "rg-prod-apps"
  location = var.location
}

resource "azurerm_resource_group" "rg_monitoring" {
  name     = "rg-prod-monitoring"
  location = var.location
}

resource "azurerm_resource_group" "rg_security" {
  name     = "rg-prod-security"
  location = var.location
}

resource "azurerm_resource_group" "rg_network" {
  name     = "rg-prod-network"
  location = var.location
}

resource "azurerm_resource_group" "rg_data" {
  name     = "rg-prod-data"
  location = var.location
}