Write-Host "Iniciando monitoreo de borrado en Azure..."
while ($true) {
    $status = az containerapp env show --name cae-prod-core --resource-group rg-prod-apps 2>&1
    if ($status -match "ResourceNotFound" -or $status -match "could not be found") {
        Write-Host "¡El entorno fue borrado! Azure nos liberó la cuota."
        break
    }
    Write-Host "Aún en proceso de borrado por Azure (ScheduledForDelete)... esperando 15 segundos..."
    Start-Sleep -Seconds 15
}

Write-Host "¡LANZANDO TERRAFORM AHORA MISMO!"
$SUB_ID = "a553ff7c-af44-470c-9ead-840cb3c5ebf7"
terraform apply -auto-approve -var "subscription_id=$SUB_ID"
