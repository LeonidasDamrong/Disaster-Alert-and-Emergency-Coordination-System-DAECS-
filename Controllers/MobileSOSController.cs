using FYP_Project_II.Data;
using FYP_Project_II.Hubs;
using FYP_Project_II.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace FYP_Project_II.Controllers
{
    [Route("api/mobile/sos")]
    [ApiController]
    public class MobileSOSController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<SOSHub> _hubContext;
        private readonly ILogger<MobileSOSController> _logger;

        public MobileSOSController(ApplicationDbContext context, IHubContext<SOSHub> hubContext, ILogger<MobileSOSController> logger)
        {
            _context = context;
            _hubContext = hubContext;
            _logger = logger;
        }

        /// <summary>
        /// Mobile (Flutter) SOS submit endpoint (legacy payload).
        /// Anonymous for emergency + early testing.
        /// </summary>
        [HttpPost]
        [AllowAnonymous]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<object>> CreateMobileSos([FromBody] MobileSosSubmitRequest request)
        {
            if (request == null) return BadRequest(new { message = "Request body is required." });

            if (!request.Latitude.HasValue || !request.Longitude.HasValue)
                return BadRequest(new { message = "latitude and longitude are required." });

            var lat = request.Latitude.Value;
            var lng = request.Longitude.Value;
            if (lat < -90 || lat > 90 || lng < -180 || lng > 180)
                return BadRequest(new { message = "latitude/longitude out of range." });

            var urgency = MapSeverityToUrgency(request.Severity);
            var now = DateTime.UtcNow;

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

            // Victim name/contact are required by existing schema; Flutter payload doesn't include them.
            // Keep backward compatible by using safe placeholders.
            var victimName = string.IsNullOrWhiteSpace(request.Title) ? "Unknown" : request.Title.Trim();
            var victimContact = "Unknown";

            var location = !string.IsNullOrWhiteSpace(request.Title)
                ? request.Title.Trim()
                : $"Lat: {lat.ToString(CultureInfo.InvariantCulture)}, Lng: {lng.ToString(CultureInfo.InvariantCulture)}";

            var description = request.Description;
            if (string.IsNullOrWhiteSpace(description))
            {
                // Keep something meaningful for admin UI if description is absent.
                description = $"Mobile SOS ({request.Type ?? "sos"}) • {request.Category ?? "SOS"} • {request.Severity ?? "Medium"}";
            }

            var sos = new SOSRequest
            {
                SOSRequestId = sosId,
                UserId = Guid.NewGuid().ToString("N"),
                VictimName = victimName,
                VictimContact = victimContact,
                Location = location,
                Latitude = (decimal)lat,
                Longitude = (decimal)lng,
                Description = description,
                UrgencyLevel = urgency,
                SOSStatus = "New",
                RequestedAt = now,
                CreatedAt = now,
                UpdatedAt = now
            };

            _context.SOSRequests.Add(sos);

            var createdLogId = $"LOG_{sosId}_{Guid.NewGuid():N}";
            var ts = TryParseUtcIso(request.Timestamp) ?? now;
            _context.SOSLogs.Add(new SOSLog
            {
                SOSLogId = createdLogId.Length <= 50 ? createdLogId : createdLogId[..50],
                SOSRequestId = sosId,
                Action = "Created",
                Details = $"Mobile payload received. severity={request.Severity ?? ""}, category={request.Category ?? ""}, type={request.Type ?? ""}, mobileTimestamp={request.Timestamp ?? ""}",
                PerformedBy = "mobile",
                Timestamp = now
            });

            await _context.SaveChangesAsync();

            // Broadcast minimal dto compatible with admin frontend.
            var dto = new
            {
                id = sos.SOSRequestId,
                userId = sos.UserId,
                victimName = sos.VictimName,
                victimPhone = sos.VictimContact,
                location = sos.Location,
                latitude = sos.Latitude,
                longitude = sos.Longitude,
                description = sos.Description ?? "",
                urgency = sos.UrgencyLevel ?? "Medium",
                status = sos.SOSStatus ?? "New",
                assignedResponder = (string?)null,
                assignedResponderName = (string?)null,
                createdAt = now.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                updatedAt = now.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                solvedAt = (string?)null,
                completionProofImageUrl = (string?)null,
                completionProofUploadedAt = (string?)null,
                completionProofUploadedBy = (string?)null
            };

            await _hubContext.Clients.Group(SOSHub.RespondersGroup).SendAsync("SOSReceived", dto);

            return StatusCode(StatusCodes.Status201Created, new { id = sosId });
        }

        private static string MapSeverityToUrgency(string? severity)
        {
            if (string.IsNullOrWhiteSpace(severity)) return "Medium";
            var s = severity.Trim();
            return s.Equals("Critical", StringComparison.OrdinalIgnoreCase) ? "Critical"
                 : s.Equals("High", StringComparison.OrdinalIgnoreCase) ? "High"
                 : s.Equals("Medium", StringComparison.OrdinalIgnoreCase) ? "Medium"
                 : s.Equals("Low", StringComparison.OrdinalIgnoreCase) ? "Low"
                 : "Medium";
        }

        private static DateTime? TryParseUtcIso(string? timestamp)
        {
            if (string.IsNullOrWhiteSpace(timestamp)) return null;
            if (DateTime.TryParse(timestamp, CultureInfo.InvariantCulture, DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal, out var dt))
            {
                return dt.Kind == DateTimeKind.Utc ? dt : DateTime.SpecifyKind(dt, DateTimeKind.Utc);
            }
            return null;
        }
    }

    /// <summary>
    /// Shipped Flutter SOS payload contract.
    /// </summary>
    public sealed class MobileSosSubmitRequest
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? Category { get; set; } // usually "SOS"
        public string? Severity { get; set; } // usually "Critical"
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? Type { get; set; } // "sos"
        public string? Timestamp { get; set; } // ISO UTC string
    }
}

