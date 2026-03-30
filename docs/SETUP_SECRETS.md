## Local setup (secrets)

This repo does not include real secrets. Configure them locally using **ASP.NET User Secrets** (recommended) or **environment variables**.

### Backend (ASP.NET) - User Secrets (recommended for local dev)

From the project directory (the one containing the `.csproj`), run:

```bash
dotnet user-secrets init

# Database
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "YOUR_SQL_CONNECTION_STRING"

# Azure Blob Storage (optional if you don't use SOS proof uploads locally)
dotnet user-secrets set "ConnectionStrings:AzureBlobStorage" "YOUR_AZURE_STORAGE_CONNECTION_STRING"

# Azure SignalR (optional; leave unset to use local SignalR)
dotnet user-secrets set "ConnectionStrings:AzureSignalR" "YOUR_AZURE_SIGNALR_CONNECTION_STRING"

# JWT
dotnet user-secrets set "Jwt:Key" "YOUR_JWT_SIGNING_KEY_AT_LEAST_32_CHARS"
dotnet user-secrets set "Jwt:Issuer" "DAECS"
dotnet user-secrets set "Jwt:Audience" "DAECS-Client"
dotnet user-secrets set "Jwt:ExpiryInHours" "24"

# Firebase (FCM) - choose ONE approach:
# Option A: Provide a path to a local JSON key file (file must NOT be committed)
dotnet user-secrets set "Firebase:ProjectId" "YOUR_FIREBASE_PROJECT_ID"
dotnet user-secrets set "Firebase:ServiceAccountJsonPath" "PATH_TO_YOUR_SERVICE_ACCOUNT_JSON"

# Option B: Inline JSON (also must NOT be committed)
# dotnet user-secrets set "Firebase:ServiceAccountJson" "{...service account json...}"
```

Notes:
- **Never** commit the Firebase service account JSON file.
- Your app reads these via `builder.Configuration` in `Program.cs`.

### Backend - Environment variables (alternative)

ASP.NET supports env var mapping with double-underscore separators:

- `ConnectionStrings__DefaultConnection`
- `ConnectionStrings__AzureBlobStorage`
- `ConnectionStrings__AzureSignalR`
- `Jwt__Key`
- `Jwt__Issuer`
- `Jwt__Audience`
- `Jwt__ExpiryInHours`
- `Firebase__ProjectId`
- `Firebase__ServiceAccountJsonPath` (or `Firebase__ServiceAccountJson`)

### Frontend (Vite) - `.env` (local only)

Create a local `.env` (already ignored by git) with:

- `VITE_GOOGLE_MAPS_API_KEY=YOUR_KEY`

Use `.env.example` as the template.
