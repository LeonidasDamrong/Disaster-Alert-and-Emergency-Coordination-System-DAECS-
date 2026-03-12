
$baseUrl = "http://localhost:5191"

# 1. Login
$loginUrl = "$baseUrl/api/account/login"
$loginBody = @{
    userId = "admin001"
    password = "Admin@123"
} | ConvertTo-Json

Write-Host "Logging in..."
try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Login successful. Token acquired."
}
catch {
    Write-Host "Login failed: $($_.Exception.Message)"
    exit
}

# 2. Create Announcement
$createUrl = "$baseUrl/api/announcements"
$headers = @{
    "Authorization" = "Bearer $token"
}

$announcementBody = @{
    title = "Test Announcement"
    content = "This is a test announcement from PowerShell."
    priority = "Low"
    isActive = $true
} | ConvertTo-Json

Write-Host "Creating announcement..."
try {
    $createResponse = Invoke-RestMethod -Uri $createUrl -Method Post -Body $announcementBody -Headers $headers -ContentType "application/json"
    Write-Host "Announcement created successfully."
    $createResponse | ConvertTo-Json -Depth 5
}
catch {
    Write-Host "Create announcement failed: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}
