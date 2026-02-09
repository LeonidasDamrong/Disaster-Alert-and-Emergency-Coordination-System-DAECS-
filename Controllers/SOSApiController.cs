using FYP_Project_II.Data;
using FYP_Project_II.Hubs;
using FYP_Project_II.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json.Serialization;

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

        public SOSApiController(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            IHubContext<SOSHub> hubContext,
            ILogger<SOSApiController> logger)
        {
            _context = context;
            _userManager = userManager;
            _hubContext = hubContext;
            _logger = logger;
        }

        private static string ToUtcIso(DateTime dt) =>
            dt.Kind == DateTimeKind.Utc ? dt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") : DateTime.SpecifyKind(dt, DateTimeKind.Utc).ToString("yyyy-MM-ddTHH:mm:ss.fffZ");

        private static string? ToUtcIso(DateTime? dt) =>
            dt.HasValue ? ToUtcIso(dt.Value) : null;

        private static object MapToDto(SOSRequest r) => new
        {
            id = r.SOSRequestId,
            userId = r.UserId,
            victimName = r.VictimName ?? "",
            victimPhone = r.VictimContact ?? "",
            location = r.Location ?? "",
            latitude = r.Latitude,
            longitude = r.Longitude,
            description = r.Description ?? "",
            urgency = r.UrgencyLevel ?? "Medium",
            status = r.SOSStatus ?? "New",
            assignedResponder = r.AssignedResponderId,
            assignedResponderName = (string?)null,
            createdAt = ToUtcIso(r.RequestedAt),
            updatedAt = ToUtcIso(r.UpdatedAt),
            solvedAt = ToUtcIso(r.SolvedAt)
        };

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
            var lastId = await _context.SOSRequests
                .Where(s => s.SOSRequestId.StartsWith(prefix))
                .OrderByDescending(s => s.SOSRequestId)
                .Select(s => s.SOSRequestId)
                .FirstOrDefaultAsync();
            var nextNum = 1;
            if (!string.IsNullOrEmpty(lastId) && int.TryParse(lastId.AsSpan(prefix.Length), out var n))
                nextNum = n + 1;
            var sosId = $"{prefix}{nextNum:D4}";

            var now = DateTime.UtcNow;
            var sos = new SOSRequest
            {
                SOSRequestId = sosId,
                UserId = request.UserId ?? Guid.NewGuid().ToString("N"),
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

            var log = new SOSLog
            {
                SOSLogId = $"LOG_{sosId}_{Guid.NewGuid():N}".Substring(0, 50),
                SOSRequestId = sosId,
                Action = "Created",
                Details = $"SOS request submitted by {request.VictimName}",
                PerformedBy = request.UserId ?? "mobile",
                Timestamp = now
            };
            _context.SOSLogs.Add(log);

            await _context.SaveChangesAsync();

            var dto = MapToDto(sos);
            await _hubContext.Clients.All.SendAsync("SOSReceived", dto);
            return CreatedAtAction(nameof(GetSOS), new { id = sosId }, dto);
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
            return Ok(list.Select(MapToDto));
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<object>> GetSOS(string id)
        {
            var sos = await _context.SOSRequests.FindAsync(id);
            if (sos == null) return NotFound();
            return Ok(MapToDto(sos));
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

            var dto = MapToDto(sos);
            await _hubContext.Clients.All.SendAsync("SOSUpdated", dto);
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
