terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "rg-prod-apps" # O el grupo donde creaste el storage
    storage_account_name = "stterraformpos2026"
    container_name       = "tfstate"
    key                  = "prod.terraform.tfstate"
  }
}

provider "azurerm" {
  features {}
  subscription_id = "a553ff7c-af44-470c-9ead-840cb3c5ebf7"
}