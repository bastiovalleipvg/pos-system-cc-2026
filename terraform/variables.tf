variable "subscription_id" {
  description = "ID de la suscripción de Azure"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Ambiente de despliegue (prod, staging)"
  type        = string
  default     = "prod"
}

variable "location" {
  description = "Región de Azure"
  type        = string
  default     = "canadacentral"
}
