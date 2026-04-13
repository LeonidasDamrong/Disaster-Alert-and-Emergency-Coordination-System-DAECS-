using FYP_Project_II.Data;
using FYP_Project_II.Hubs;
using FYP_Project_II.Models;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace FYP_Project_II.Controllers
{
    [Route("api/sos")]
    [ApiController]
    public class SOSApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IHubContext<SOSHub> _hubContext;
        private readonly ILogger<SOSApiController> _logger;
        private readonly BlobServiceClient? _blobServiceClient;
        private readonly IConfiguration _configuration;

        public SOSApiController(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            IHubContext<SOSHub> hubContext,
            ILogger<SOSApiController> logger,
            IConfiguration configuration,
            BlobServiceClient? blobServiceClient = null)
        {
            _context = context;
            _userManager = userManager;
            _hubContext = hubContext;
            _logger = logger;
            _configuration = configuration;
            _blobServiceClient = blobServiceClient;
        }

        // Reverse geocoding (best-effort) for display purposes.
        // Uses OpenStreetMap Nominatim; keep timeouts low and swallow failures.
        private static readonly HttpClient _geoHttp = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(2)
        };

        private static string? GetFirstNonEmpty(JsonElement address, params string[] keys)
        {
            foreach (var k in keys)
            {
                if (address.TryGetProperty(k, out var v))
                {
                    var s = v.GetString();
                    if (!string.IsNullOrWhiteSpace(s)) return s.Trim();
                }
            }
            return null;
        }

        private static string? BuildAreaState(JsonElement address)
        {
            // "Area" is intentionally flexible: suburb/neighbourhood/city/town/village/municipality/county.
            var area =
                GetFirstNonEmpty(address, "suburb", "neighbourhood", "city_district", "city", "town", "village", "municipality", "county");
            var state = GetFirstNonEmpty(address, "state", "region");

            if (!string.IsNullOrWhiteSpace(area) && !string.IsNullOrWhiteSpace(state))
                return $"{area}, {state}";
            if (!string.IsNullOrWhiteSpace(state))
                return state;
            return area;
        }

        private static async Task<string?> TryReverseGeocodeAsync(decimal lat, decimal lng)
        {
            try
            {
                // Nominatim requires a User-Agent.
                if (_geoHttp.DefaultRequestHeaders.UserAgent.Count == 0)
                {
                    _geoHttp.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("FYP-Project-II", "1.0"));
                }

                var url = $"https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat={lat.ToString(System.Globalization.CultureInfo.InvariantCulture)}&lon={lng.ToString(System.Globalization.CultureInfo.InvariantCulture)}";
                using var res = await _geoHttp.GetAsync(url);
                if (!res.IsSuccessStatusCode) return null;

                var json = await res.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("address", out var addr) && addr.ValueKind == JsonValueKind.Object)
                {
                    var simple = BuildAreaState(addr);
                    if (!string.IsNullOrWhiteSpace(simple)) return simple;
                }

                if (doc.RootElement.TryGetProperty("display_name", out var dn))
                {
                    var s = dn.GetString();
                    return string.IsNullOrWhiteSpace(s) ? null : s;
                }
                return null;
            }
            catch
            {
                return null;
            }
        }

        private static string ToUtcIso(DateTime dt) =>
            dt.Kind == DateTimeKind.Utc ? dt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") : DateTime.SpecifyKind(dt, DateTimeKind.Utc).ToString("yyyy-MM-ddTHH:mm:ss.fffZ");

        private static string? ToUtcIso(DateTime? dt) =>
            dt.HasValue ? ToUtcIso(dt.Value) : null;

        private string? TryGetProofImageViewUrl(string? storedUrlOrUri)
        {
            if (string.IsNullOrWhiteSpace(storedUrlOrUri)) return null;

            // If it's already a SAS URL, keep it.
            if (storedUrlOrUri.Contains("sig=", StringComparison.OrdinalIgnoreCase)) return storedUrlOrUri;

            if (_blobServiceClient == null) return storedUrlOrUri;

            var containerName = _configuration["Storage:SOSProofContainer"];
            if (string.IsNullOrWhiteSpace(containerName)) containerName = "sos-proofs";

            if (!Uri.TryCreate(storedUrlOrUri, UriKind.Absolute, out var uri)) return storedUrlOrUri;

            // Expected format: https://{account}.blob.core.windows.net/{container}/{blobPath...}
            var segments = uri.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries);
            if (segments.Length < 2) return storedUrlOrUri;

            var containerFromUrl = segments[0];
            if (!string.Equals(containerFromUrl, containerName, StringComparison.OrdinalIgnoreCase))
            {
                // If container differs, still try using containerFromUrl.
                containerName = containerFromUrl;
            }

            var blobName = string.Join('/', segments.Skip(1));
            var blob = _blobServiceClient.GetBlobContainerClient(containerName).GetBlobClient(blobName);
            if (!blob.CanGenerateSasUri) return storedUrlOrUri;

            var sas = new BlobSasBuilder
            {
                BlobContainerName = containerName,
                BlobName = blobName,
                Resource = "b",
                ExpiresOn = DateTimeOffset.UtcNow.AddHours(12)
            };
            sas.SetPermissions(BlobSasPermissions.Read);

            return blob.GenerateSasUri(sas).ToString();
        }

        private async Task<(string? assignedResponder, string? assignedResponderName)> ResolveAssignedResponderAsync(SOSRequest r)
        {
            var assigned = r.AssignedResponderId;
            if (string.IsNullOrWhiteSpace(assigned))
                return (null, null);

            // If AssignedResponderId is an Identity userId (GUID), resolve to username/name.
            var user = await _userManager.FindByIdAsync(assigned);
            if (user == null)
            {
                // Otherwise treat it as already a username (seeded data).
                return (assigned, assigned);
            }

            var username = user.UserName ?? assigned;
            var displayName = string.IsNullOrWhiteSpace(user.Name) ? username : user.Name;
            return (username, displayName);
        }

        private async Task<object> MapToDtoAsync(SOSRequest r)
        {
            var (assignedResponder, assignedResponderName) = await ResolveAssignedResponderAsync(r);
            var rawLocation = r.Location ?? "";
            var looksLikeLatLng =
                string.IsNullOrWhiteSpace(rawLocation) ||
                rawLocation.StartsWith("Lat:", StringComparison.OrdinalIgnoreCase) ||
                rawLocation.StartsWith("Lat ", StringComparison.OrdinalIgnoreCase);

            var locationName = looksLikeLatLng ? await TryReverseGeocodeAsync(r.Latitude, r.Longitude) : rawLocation;

            return new
        {
            id = r.SOSRequestId,
            userId = r.UserId,
            victimName = r.VictimName ?? "",
            victimPhone = r.VictimContact ?? "",
            location = rawLocation,
            locationName = locationName,
            latitude = r.Latitude,
            longitude = r.Longitude,
            description = r.Description ?? "",
            urgency = r.UrgencyLevel ?? "Medium",
            status = r.SOSStatus ?? "New",
            assignedResponder = assignedResponder,
            assignedResponderName = assignedResponderName,
            createdAt = ToUtcIso(r.RequestedAt),
            updatedAt = ToUtcIso(r.UpdatedAt),
            solvedAt = ToUtcIso(r.SolvedAt),
            completionProofImageUrl = TryGetProofImageViewUrl(r.CompletionProofImageUrl),
            completionProofUploadedAt = ToUtcIso(r.CompletionProofUploadedAt),
            completionProofUploadedBy = r.CompletionProofUploadedBy
        };
        }

        private static string GenerateTrackingToken()
        {
            // URL-safe base64 without padding.
            Span<byte> bytes = stackalloc byte[24]; // 192 bits
            RandomNumberGenerator.Fill(bytes);
            return Convert.ToBase64String(bytes)
                .TrimEnd('=')
                .Replace('+', '-')
                .Replace('/', '_');
        }

        /// <summary>
        /// Mobile API: Submit SOS request. No authentication required for emergency access.
        /// </summary>
        [HttpPost]
        [AllowAnonymous]
        public async Task<ActionResult<object>> CreateSOS([FromBody] CreateSOSRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.VictimName) || string.IsNullOrWhiteSpace(request.VictimContact))
            {
                return BadRequest(new { message = "Victim name and contact are required." });
            }

            var validUrgency = new[] { "Low", "Medium", "High", "Critical" };
            var urgency = string.IsNullOrWhiteSpace(request.UrgencyLevel) ? "Medium" : request.UrgencyLevel;
            if (!validUrgency.Contains(urgency))
            {
                return BadRequest(new { message = "Urgency must be one of: Low, Medium, High, Critical." });
            }

            var prefix = "SOS";
            // Keep backward compatible with older IDs like "SOS001" while generating the new format "SOSXXXX".
            // Prefer longer IDs first (e.g. 7 chars "SOS0001" > 6 chars "SOS001"), then lexicographical.
            var lastId = await _context.SOSRequests
                .Where(s => s.SOSRequestId.StartsWith(prefix))
                .OrderByDescending(s => s.SOSRequestId.Length)
                .ThenByDescending(s => s.SOSRequestId)
                .Select(s => s.SOSRequestId)
                .FirstOrDefaultAsync();
            var nextNum = 1;
            if (!string.IsNullOrEmpty(lastId) && int.TryParse(lastId.AsSpan(prefix.Length), out var n))
                nextNum = n + 1;
            // New ID format: SOSXXXX (4 digits, zero-padded)
            var sosId = $"{prefix}{nextNum:D4}";

            var now = DateTime.UtcNow;
            var trackingToken = GenerateTrackingToken();
            var sos = new SOSRequest
            {
                SOSRequestId = sosId,
                UserId = request.UserId ?? Guid.NewGuid().ToString("N"),
                TrackingToken = trackingToken,
                VictimName = request.VictimName,
                VictimContact = request.VictimContact,
                Location = request.Location ?? "",
                Latitude = request.Latitude ?? 0,
                Longitude = request.Longitude ?? 0,
                Description = request.Description,
                UrgencyLevel = urgency,
                SOSStatus = "New",
                RequestedAt = now,
                CreatedAt = now,
                UpdatedAt = now
            };

            _context.SOSRequests.Add(sos);

            var createdLogId = $"LOG_{sosId}_{Guid.NewGuid():N}";
            var log = new SOSLog
            {
                SOSLogId = createdLogId.Length <= 50 ? createdLogId : createdLogId[..50],
                SOSRequestId = sosId,
                Action = "Created",
                Details = $"SOS request submitted by {request.VictimName}",
                PerformedBy = request.UserId ?? "mobile",
                Timestamp = now
            };
            _context.SOSLogs.Add(log);

            await _context.SaveChangesAsync();

            var dto = await MapToDtoAsync(sos);
            await _hubContext.Clients.Group(SOSHub.RespondersGroup).SendAsync("SOSReceived", dto);
            return StatusCode(StatusCodes.Status201Created, new
            {
                id = sosId,
                trackingToken,
                status = "New",
                createdAt = ToUtcIso(now),
                updatedAt = ToUtcIso(now)
            });
        }

        /// <summary>
        /// Get all SOS requests. Requires authentication (Admin/Responder).
        /// </summary>
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<object>>> GetSOSRequests([FromQuery] string? status = null)
        {
            var query = _context.SOSRequests.AsQueryable();
            if (!string.IsNullOrWhiteSpace(status) && status != "All")
            {
                query = query.Where(s => s.SOSStatus == status);
            }
            var list = await query.OrderByDescending(s => s.RequestedAt).ToListAsync();
            var dtos = new List<object>(list.Count);
            foreach (var r in list)
            {
                dtos.Add(await MapToDtoAsync(r));
            }
            return Ok(dtos);
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<object>> GetSOS(string id)
        {
            var sos = await _context.SOSRequests.FindAsync(id);
            if (sos == null) return NotFound();
            return Ok(await MapToDtoAsync(sos));
        }

        [HttpGet("{id}/notes")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<object>>> GetCaseNotes(string id)
        {
            var notes = await _context.CaseNotes
                .Where(n => n.SOSRequestId == id)
                .OrderBy(n => n.Timestamp)
                .ToListAsync();
            return Ok(notes.Select(n => new
            {
                id = n.CaseNoteId,
                author = n.ResponderId,
                timestamp = ToUtcIso(n.Timestamp),
                note = n.Note
            }));
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult<object>> UpdateSOS(string id, [FromBody] UpdateSOSRequest? request)
        {
            var sos = await _context.SOSRequests.FindAsync(id);
            if (sos == null) return NotFound();
            if (request == null) return BadRequest(new { message = "Request body is required." });

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            var userName = User.Identity?.Name ?? "Unknown";

            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                var validStatus = new[] { "New", "In Progress", "Completed" };
                if (!validStatus.Contains(request.Status))
                    return BadRequest(new { message = "Status must be one of: New, In Progress, Completed." });
                var oldStatus = sos.SOSStatus;
                sos.SOSStatus = request.Status;
                if (request.Status == "Completed")
                {
                    sos.SolvedBy = userId;
                    sos.SolvedAt = DateTime.UtcNow;
                }
                var logId = $"LOG_{id}_{Guid.NewGuid():N}";
                _context.SOSLogs.Add(new SOSLog
                {
                    SOSLogId = logId.Length <= 50 ? logId : logId[..50],
                    SOSRequestId = id,
                    Action = "StatusUpdate",
                    Details = $"Status changed from {oldStatus} to {request.Status}",
                    PerformedBy = userName,
                    Timestamp = DateTime.UtcNow
                });
            }

            if (!string.IsNullOrWhiteSpace(request.UrgencyLevel))
            {
                var validUrgency = new[] { "Low", "Medium", "High", "Critical" };
                if (!validUrgency.Contains(request.UrgencyLevel))
                    return BadRequest(new { message = "Urgency must be one of: Low, Medium, High, Critical." });
                sos.UrgencyLevel = request.UrgencyLevel;
            }

            if (request.Accept != null && request.Accept == true && sos.SOSStatus == "New")
            {
                sos.SOSStatus = "In Progress";
                sos.AssignedResponderId = userId;
                var acceptLogId = $"LOG_{id}_{Guid.NewGuid():N}";
                _context.SOSLogs.Add(new SOSLog
                {
                    SOSLogId = acceptLogId.Length <= 50 ? acceptLogId : acceptLogId[..50],
                    SOSRequestId = id,
                    Action = "Accepted",
                    Details = $"Request accepted by {userName}",
                    PerformedBy = userName,
                    Timestamp = DateTime.UtcNow
                });
            }

            sos.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var dto = await MapToDtoAsync(sos);
            await _hubContext.Clients.Group(SOSHub.RespondersGroup).SendAsync("SOSUpdated", dto);
            await _hubContext.Clients.Group(SOSVictimHub.VictimGroupPrefix + id).SendAsync("SOSUpdated", dto);
            return Ok(dto);
        }

        [HttpPost("{id}/completion-proof")]
        [Authorize]
        [RequestSizeLimit(6_000_000)] // ~6MB
        public async Task<ActionResult<object>> UploadCompletionProof(string id, [FromForm] IFormFile? file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Image file is required." });

            var sos = await _context.SOSRequests.FindAsync(id);
            if (sos == null) return NotFound(new { message = "SOS request not found." });

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "Unauthorized." });

            // Only allow assigned responder.
            // Note: some existing data uses username for AssignedResponderId, while new accepts use Identity userId.
            var userName = User.Identity?.Name;
            var appUser = await _userManager.FindByIdAsync(userId);
            var userUserName = appUser?.UserName;

            if (!string.IsNullOrEmpty(sos.AssignedResponderId))
            {
                var assigned = sos.AssignedResponderId;
                var ok =
                    string.Equals(assigned, userId, StringComparison.OrdinalIgnoreCase) ||
                    (!string.IsNullOrEmpty(userName) && string.Equals(assigned, userName, StringComparison.OrdinalIgnoreCase)) ||
                    (!string.IsNullOrEmpty(userUserName) && string.Equals(assigned, userUserName, StringComparison.OrdinalIgnoreCase));

                if (!ok) return Forbid();
            }

            var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "image/jpeg",
                "image/png",
                "image/webp"
            };
            if (!allowed.Contains(file.ContentType))
                return BadRequest(new { message = "Only JPG, PNG, or WEBP images are allowed." });
            if (file.Length > 5_000_000)
                return BadRequest(new { message = "Image must be 5MB or less." });

            var ext = Path.GetExtension(file.FileName);
            if (string.IsNullOrWhiteSpace(ext)) ext = file.ContentType switch
            {
                "image/png" => ".png",
                "image/webp" => ".webp",
                _ => ".jpg"
            };
            ext = Regex.Replace(ext, @"[^a-zA-Z0-9\.]", "");
            if (ext.Length > 10) ext = ext[..10];

            if (_blobServiceClient == null)
            {
                return StatusCode(500, new { message = "Azure Blob Storage is not configured on the server." });
            }

            var containerName = _configuration["Storage:SOSProofContainer"];
            if (string.IsNullOrWhiteSpace(containerName)) containerName = "sos-proofs";

            var container = _blobServiceClient.GetBlobContainerClient(containerName);
            await container.CreateIfNotExistsAsync();

            var blobName = $"sos/{id}/completion-proof/{DateTime.UtcNow:yyyyMMddHHmmss}_{Guid.NewGuid():N}{ext}";
            var blob = container.GetBlobClient(blobName);

            await using (var stream = file.OpenReadStream())
            {
                await blob.UploadAsync(stream, new BlobUploadOptions
                {
                    HttpHeaders = new BlobHttpHeaders
                    {
                        ContentType = file.ContentType
                    }
                });
            }

            // Store blob URL (ensure container has appropriate read access, or later switch to SAS URLs)
            sos.CompletionProofImageUrl = blob.Uri.ToString();
            sos.CompletionProofUploadedAt = DateTime.UtcNow;
            sos.CompletionProofUploadedBy = appUser?.Name ?? userUserName ?? userName ?? userId;
            sos.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            var dto = await MapToDtoAsync(sos);
            await _hubContext.Clients.Group(SOSHub.RespondersGroup).SendAsync("SOSUpdated", dto);
            await _hubContext.Clients.Group(SOSVictimHub.VictimGroupPrefix + id).SendAsync("SOSUpdated", dto);
            return Ok(dto);
        }

        [HttpPost("{id}/notes")]
        [Authorize]
        public async Task<ActionResult<object>> AddCaseNote(string id, [FromBody] AddCaseNoteRequest? request)
        {
            try
            {
                var sos = await _context.SOSRequests.FindAsync(id);
                if (sos == null) return NotFound(new { message = "SOS request not found." });
                if (request == null || string.IsNullOrWhiteSpace(request.Note))
                    return BadRequest(new { message = "Note content is required." });

                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
                var userName = User.Identity?.Name ?? "Unknown";
                if (!string.IsNullOrEmpty(userId))
                {
                    var appUser = await _userManager.FindByIdAsync(userId);
                    if (appUser != null && !string.IsNullOrEmpty(appUser.Name))
                        userName = appUser.Name;
                    else if (appUser?.UserName != null)
                        userName = appUser.UserName;
                }

                var prefix = "NOTE";
                var lastId = await _context.CaseNotes
                    .Where(n => n.CaseNoteId.StartsWith(prefix))
                    .OrderByDescending(n => n.CaseNoteId)
                    .Select(n => n.CaseNoteId)
                    .FirstOrDefaultAsync();
                var nextNum = 1;
                if (!string.IsNullOrEmpty(lastId) && lastId.Length > prefix.Length && int.TryParse(lastId.AsSpan(prefix.Length), out var n))
                    nextNum = n + 1;
                var caseNoteId = $"{prefix}{nextNum:D3}";

                var note = new CaseNote
                {
                    CaseNoteId = caseNoteId,
                    SOSRequestId = id,
                    ResponderId = userName,
                    Note = request.Note.Trim(),
                    Timestamp = DateTime.UtcNow
                };
                _context.CaseNotes.Add(note);
                sos.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                var dto = new { id = note.CaseNoteId, author = userName, timestamp = ToUtcIso(note.Timestamp), note = note.Note };
                return Ok(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AddCaseNote failed for SOS {SosId}", id);
                return StatusCode(500, new { message = "Failed to save case note. Please try again." });
            }
        }

        [HttpGet("danger-zones")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<object>>> GetDangerZones()
        {
            var zones = await _context.DangerZones
                .Where(z => z.IsActive)
                .OrderBy(z => z.DangerLevel)
                .ToListAsync();
            return Ok(zones.Select(z => new
            {
                id = z.DangerZoneId,
                name = z.Name,
                description = z.Description,
                centerLatitude = z.CenterLatitude,
                centerLongitude = z.CenterLongitude,
                radiusMeters = z.RadiusMeters,
                dangerLevel = z.DangerLevel,
                colorHex = z.ColorHex ?? "#ff0000"
            }));
        }
    }

    public class CreateSOSRequest
    {
        public string? UserId { get; set; }
        public string VictimName { get; set; } = "";
        public string VictimContact { get; set; } = "";
        public string? Location { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public string? Description { get; set; }
        public string? UrgencyLevel { get; set; }
    }

    public class UpdateSOSRequest
    {
        [JsonPropertyName("status")]
        public string? Status { get; set; }
        [JsonPropertyName("urgency")]
        public string? UrgencyLevel { get; set; }
        [JsonPropertyName("accept")]
        public bool? Accept { get; set; }
    }

    public class AddCaseNoteRequest
    {
        [JsonPropertyName("note")]
        public string Note { get; set; } = "";
    }
}
