$SUB_ID = "a553ff7c-af44-470c-9ead-840cb3c5ebf7"

Write-Host "Iniciando importación Lift & Shift de Terraform..." -ForegroundColor Cyan

# 1. Resource Groups
# rg_apps ya estaba importado en el state remoto, lo omitimos.
terraform import -var "subscription_id=$SUB_ID" azurerm_resource_group.rg_monitoring "/subscriptions/$SUB_ID/resourceGroups/rg-prod-monitoring"
terraform import -var "subscription_id=$SUB_ID" azurerm_resource_group.rg_security "/subscriptions/$SUB_ID/resourceGroups/rg-prod-security"
terraform import -var "subscription_id=$SUB_ID" azurerm_resource_group.rg_network "/subscriptions/$SUB_ID/resourceGroups/rg-prod-network"
terraform import -var "subscription_id=$SUB_ID" azurerm_resource_group.rg_data "/subscriptions/$SUB_ID/resourceGroups/rg-prod-data"

# 2. Redes
terraform import -var "subscription_id=$SUB_ID" azurerm_virtual_network.vnet_pos "/subscriptions/$SUB_ID/resourceGroups/rg-prod-network/providers/Microsoft.Network/virtualNetworks/vnet-prod-pos"

terraform import -var "subscription_id=$SUB_ID" azurerm_subnet.subnet_appgw "/subscriptions/$SUB_ID/resourceGroups/rg-prod-network/providers/Microsoft.Network/virtualNetworks/vnet-prod-pos/subnets/subnet-appgw"
terraform import -var "subscription_id=$SUB_ID" azurerm_subnet.subnet_redis "/subscriptions/$SUB_ID/resourceGroups/rg-prod-network/providers/Microsoft.Network/virtualNetworks/vnet-prod-pos/subnets/subnet-redis"
terraform import -var "subscription_id=$SUB_ID" azurerm_subnet.subnet_pe "/subscriptions/$SUB_ID/resourceGroups/rg-prod-network/providers/Microsoft.Network/virtualNetworks/vnet-prod-pos/subnets/subnet-private-endpoint"
terraform import -var "subscription_id=$SUB_ID" azurerm_subnet.subnet_aca "/subscriptions/$SUB_ID/resourceGroups/rg-prod-network/providers/Microsoft.Network/virtualNetworks/vnet-prod-pos/subnets/subnet-containerapps"
terraform import -var "subscription_id=$SUB_ID" azurerm_subnet.subnet_postgres "/subscriptions/$SUB_ID/resourceGroups/rg-prod-network/providers/Microsoft.Network/virtualNetworks/vnet-prod-pos/subnets/subnet-postgres"
terraform import -var "subscription_id=$SUB_ID" azurerm_subnet.subnet_fw "/subscriptions/$SUB_ID/resourceGroups/rg-prod-network/providers/Microsoft.Network/virtualNetworks/vnet-prod-pos/subnets/AzureFirewallSubnet"

# NSGs
terraform import -var "subscription_id=$SUB_ID" azurerm_network_security_group.nsg_appgw "/subscriptions/$SUB_ID/resourceGroups/rg-prod-network/providers/Microsoft.Network/networkSecurityGroups/nsg-prod-appgw"
terraform import -var "subscription_id=$SUB_ID" azurerm_network_security_group.nsg_redis "/subscriptions/$SUB_ID/resourceGroups/rg-prod-network/providers/Microsoft.Network/networkSecurityGroups/nsg-prod-redis"
terraform import -var "subscription_id=$SUB_ID" azurerm_network_security_group.nsg_aca "/subscriptions/$SUB_ID/resourceGroups/rg-prod-network/providers/Microsoft.Network/networkSecurityGroups/nsg-prod-containerapps"
terraform import -var "subscription_id=$SUB_ID" azurerm_network_security_group.nsg_postgres "/subscriptions/$SUB_ID/resourceGroups/rg-prod-network/providers/Microsoft.Network/networkSecurityGroups/nsg-prod-postgres"

# 3. Security
terraform import -var "subscription_id=$SUB_ID" azurerm_key_vault.kv_pos "/subscriptions/$SUB_ID/resourceGroups/rg-prod-security/providers/Microsoft.KeyVault/vaults/kv-prod-pos-core"
terraform import -var "subscription_id=$SUB_ID" azurerm_private_endpoint.pe_kv "/subscriptions/$SUB_ID/resourceGroups/rg-prod-security/providers/Microsoft.Network/privateEndpoints/pe-kv-prod-core"

# 4. Storage
terraform import -var "subscription_id=$SUB_ID" azurerm_storage_account.st_prod "/subscriptions/$SUB_ID/resourceGroups/rg-prod-security/providers/Microsoft.Storage/storageAccounts/stprodposcanada"
terraform import -var "subscription_id=$SUB_ID" azurerm_private_endpoint.pe_storage_blob "/subscriptions/$SUB_ID/resourceGroups/rg-prod-data/providers/Microsoft.Network/privateEndpoints/pe-storage-blob"

# 5. Compute
terraform import -var "subscription_id=$SUB_ID" azurerm_log_analytics_workspace.law "/subscriptions/$SUB_ID/resourceGroups/rg-prod-monitoring/providers/Microsoft.OperationalInsights/workspaces/law-prod-monitoring"
terraform import -var "subscription_id=$SUB_ID" azurerm_container_app_environment.cae "/subscriptions/$SUB_ID/resourceGroups/rg-prod-apps/providers/Microsoft.App/managedEnvironments/cae-prod-core"

terraform import -var "subscription_id=$SUB_ID" azurerm_container_app.frontend "/subscriptions/$SUB_ID/resourceGroups/rg-prod-apps/providers/Microsoft.App/containerApps/app-frontend-core"
terraform import -var "subscription_id=$SUB_ID" azurerm_container_app.backend "/subscriptions/$SUB_ID/resourceGroups/rg-prod-apps/providers/Microsoft.App/containerApps/app-backend-core"
terraform import -var "subscription_id=$SUB_ID" azurerm_container_app.grafana "/subscriptions/$SUB_ID/resourceGroups/rg-prod-apps/providers/Microsoft.App/containerApps/app-grafana-core"

# 6. Gateway
terraform import -var "subscription_id=$SUB_ID" azurerm_public_ip.pip_agw "/subscriptions/$SUB_ID/resourceGroups/rg-prod-apps/providers/Microsoft.Network/publicIPAddresses/pip-agw-pos"
terraform import -var "subscription_id=$SUB_ID" azurerm_web_application_firewall_policy.waf_policy "/subscriptions/$SUB_ID/resourceGroups/rg-prod-apps/providers/Microsoft.Network/ApplicationGatewayWebApplicationFirewallPolicies/waf-policy-pos-prod"
terraform import -var "subscription_id=$SUB_ID" azurerm_application_gateway.agw "/subscriptions/$SUB_ID/resourceGroups/rg-prod-apps/providers/Microsoft.Network/applicationGateways/agw-pos-prod"

Write-Host "Importación completada. Por favor ejecuta 'terraform plan' para reconciliar." -ForegroundColor Green
