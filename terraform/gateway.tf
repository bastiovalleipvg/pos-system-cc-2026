resource "azurerm_public_ip" "pip_agw" {
  name                = "pip-agw-pos"
  resource_group_name = azurerm_resource_group.rg_apps.name
  location            = azurerm_resource_group.rg_apps.location
  allocation_method   = "Static"
  sku                 = "Standard"
  zones               = ["1", "2", "3"]
}

resource "azurerm_web_application_firewall_policy" "waf_policy" {
  name                = "waf-policy-pos-prod"
  resource_group_name = azurerm_resource_group.rg_apps.name
  location            = azurerm_resource_group.rg_apps.location

  policy_settings {
    enabled                     = true
    mode                        = "Detection"
    request_body_check          = true
    file_upload_limit_in_mb     = 100
    max_request_body_size_in_kb = 128
  }

  lifecycle {
    ignore_changes = [
      policy_settings[0].js_challenge_cookie_expiration_in_minutes
    ]
  }

  managed_rules {
    managed_rule_set {
      type    = "OWASP"
      version = "3.2"
    }
  }
}

resource "azurerm_application_gateway" "agw" {
  name                = "agw-pos-prod"
  resource_group_name = azurerm_resource_group.rg_apps.name
  location            = azurerm_resource_group.rg_apps.location

  sku {
    name     = "WAF_v2"
    tier     = "WAF_v2"
    capacity = 1
  }

  gateway_ip_configuration {
    name      = "appGatewayIpConfig"
    subnet_id = azurerm_subnet.subnet_appgw.id
  }

  frontend_port {
    name = "port_80"
    port = 80
  }

  frontend_ip_configuration {
    name                 = "appGwPublicFrontendIpIPv4"
    public_ip_address_id = azurerm_public_ip.pip_agw.id
  }

  backend_address_pool {
    name  = "aca-pool"
    fqdns = ["cae-prod-core.ambitiouscliff-28478ba7.canadacentral.azurecontainerapps.io"]
  }

  backend_http_settings {
    name                                = "https-settings"
    cookie_based_affinity               = "Disabled"
    port                                = 443
    protocol                            = "Https"
    request_timeout                     = 20
    pick_host_name_from_backend_address = true
  }

  http_listener {
    name                           = "listener_http"
    frontend_ip_configuration_name = "appGwPublicFrontendIpIPv4"
    frontend_port_name             = "port_80"
    protocol                       = "Http"
  }

  request_routing_rule {
    name                       = "rule1"
    rule_type                  = "Basic"
    http_listener_name         = "listener_http"
    backend_address_pool_name  = "aca-pool"
    backend_http_settings_name = "https-settings"
    priority                   = 100
  }

  firewall_policy_id = azurerm_web_application_firewall_policy.waf_policy.id
}
