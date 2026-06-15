resource "azurerm_log_analytics_workspace" "law" {
  name                = "law-prod-monitoring"
  location            = azurerm_resource_group.rg_monitoring.location
  resource_group_name = azurerm_resource_group.rg_monitoring.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

resource "azurerm_container_app_environment" "cae" {
  name                           = "cae-prod-core"
  location                       = azurerm_resource_group.rg_apps.location
  resource_group_name            = azurerm_resource_group.rg_apps.name
  log_analytics_workspace_id     = azurerm_log_analytics_workspace.law.id
  infrastructure_subnet_id       = azurerm_subnet.subnet_aca.id
  internal_load_balancer_enabled = true
}

resource "azurerm_container_app" "frontend" {
  name                         = "app-frontend-core"
  container_app_environment_id = azurerm_container_app_environment.cae.id
  resource_group_name          = azurerm_resource_group.rg_apps.name
  revision_mode                = "Single"

  identity {
    type = "SystemAssigned"
  }

  template {
    container {
      name   = "frontend"
      image  = "acrposdevops.azurecr.io/pos-frontend:latest"
      cpu    = 0.25
      memory = "0.5Gi"
    }
  }

  ingress {
    external_enabled = true
    target_port      = 3000
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].container[0].image,
      template[0].container[0].env,
      template[0].revision_suffix,
      ingress[0].custom_domain,
      registry
    ]
  }
}

resource "azurerm_container_app" "backend" {
  name                         = "app-backend-core"
  container_app_environment_id = azurerm_container_app_environment.cae.id
  resource_group_name          = azurerm_resource_group.rg_apps.name
  revision_mode                = "Single"

  identity {
    type = "SystemAssigned"
  }

  template {
    container {
      name   = "backend"
      image  = "acrposdevops.azurecr.io/pos-backend:latest"
      cpu    = 0.25
      memory = "0.5Gi"
    }
  }

  ingress {
    external_enabled = true
    target_port      = 3001
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].container[0].image,
      template[0].container[0].env,
      template[0].revision_suffix,
      ingress[0].custom_domain,
      registry
    ]
  }
}

resource "azurerm_container_app" "grafana" {
  name                         = "app-grafana-core"
  container_app_environment_id = azurerm_container_app_environment.cae.id
  resource_group_name          = azurerm_resource_group.rg_apps.name
  revision_mode                = "Single"

  identity {
    type = "SystemAssigned"
  }

  template {
    min_replicas = 1
    max_replicas = 1 # Fixed for session consistency!
    
    container {
      name   = "grafana"
      image  = "docker.io/grafana/grafana-oss:latest"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "GF_SERVER_ROOT_URL"
        value = "https://grafana.cloudpos6.tech/"
      }
      env {
        name  = "GF_SERVER_DOMAIN"
        value = "grafana.cloudpos6.tech"
      }
      env {
        name  = "GF_SECURITY_ADMIN_PASSWORD"
        value = "CloudPOS2026!"
      }
      env {
        name  = "GF_SECURITY_CSRF_TRUSTED_ORIGINS"
        value = "https://grafana.cloudpos6.tech"
      }
      env {
        name  = "GF_LIVE_ALLOWED_ORIGINS"
        value = "https://grafana.cloudpos6.tech"
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 3000
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].container[0].image,
      template[0].revision_suffix,
      ingress[0].custom_domain,
      registry
    ]
  }
}
