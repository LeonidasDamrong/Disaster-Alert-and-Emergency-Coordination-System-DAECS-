## Local setup (secrets)

This repo does not include real secrets. Configure them locally using **ASP.NET User Secrets** (recommended) or **environment variables**.

### Backend (ASP.NET) - User Secrets (recommended for local dev)

From the project directory (the one containing the `.csproj`), run:

```bash
dotnet user-secrets init

# Database
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=tcp:fyp-server-leonidas.database.windows.net,1433;Initial Catalog=FYP-Database;User ID=fyp_admin;MultipleActiveResultSets=True;Encrypt=True;"

# Azure Blob Storage (optional if you don't use SOS proof uploads locally)
dotnet user-secrets set "ConnectionStrings:AzureBlobStorage" "DefaultEndpointsProtocol=https;AccountName=fypstorageleon;AccountKey=YnQoxUqJ0UwqhNNdPaGYU/7mzUH+mE8T4oTfFZ6yCI83Hpger9T/fszy/pNIctF/BnhML34KB9aV+AStb0NvYQ==;EndpointSuffix=core.windows.net"

# Azure SignalR (optional; leave unset to use local SignalR)
dotnet user-secrets set "ConnectionStrings:AzureSignalR" "YOUR_AZURE_SIGNALR_CONNECTION_STRING"

# JWT
dotnet user-secrets set "Jwt:Key" "YOUR_JWT_SIGNING_KEY_AT_LEAST_32_CHARS"
dotnet user-secrets set "Jwt:Issuer" "DAECS"
dotnet user-secrets set "Jwt:Audience" "DAECS-Client"
dotnet user-secrets set "Jwt:ExpiryInHours" "24"

# Firebase (FCM) - choose ONE approach:
# Option A: Provide a path to a local JSON key file (file must NOT be committed)
dotnet user-secrets set "Firebase:ProjectId" "daecsapp2026"
dotnet user-secrets set "Firebase:ServiceAccountJsonPath" "daecsapp2026-firebase-adminsdk-fbsvc-2d08ba2516.json"

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
