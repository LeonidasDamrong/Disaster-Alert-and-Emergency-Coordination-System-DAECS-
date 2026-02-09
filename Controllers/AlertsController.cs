using FYP_Project_II.Data;
using FYP_Project_II.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json.Serialization;

namespace FYP_Project_II.Controllers
{
    [Route("api/alerts")]
    [ApiController]
    [Authorize]
    public class AlertsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public AlertsController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        private static string? ToUtcIso(DateTime? dt) =>
            dt.HasValue ? dt.Value.Kind == DateTimeKind.Utc ? dt.Value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") : DateTime.SpecifyKind(dt.Value, DateTimeKind.Utc).ToString("yyyy-MM-ddTHH:mm:ss.fffZ") : null;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetAlerts()
        {
            var alerts = await _context.Alerts
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
            var result = alerts.Select(a => new
            {
                id = a.AlertId,
                title = a.Title,
                message = a.Description,
                type = a.Severity,
                targetAudience = a.TargetAudience,
                status = a.Status,
                createdBy = a.CreatedBy ?? "Unknown",
                scheduledFor = ToUtcIso(a.ScheduledFor),
                sentAt = ToUtcIso(a.SentAt),
                createdAt = ToUtcIso(a.CreatedAt)
            }).ToList();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetAlert(string id)
        {
            var alert = await _context.Alerts.FindAsync(id);
            if (alert == null) return NotFound();

            return Ok(new
            {
                id = alert.AlertId,
                title = alert.Title,
                message = alert.Description,
                type = alert.Severity,
                targetAudience = alert.TargetAudience,
                status = alert.Status,
                createdBy = alert.CreatedBy ?? "Unknown",
                scheduledFor = ToUtcIso(alert.ScheduledFor),
                sentAt = ToUtcIso(alert.SentAt),
                createdAt = ToUtcIso(alert.CreatedAt)
            });
        }

        [HttpPost]
        public async Task<ActionResult<object>> CreateAlert([FromBody] CreateAlertRequest request)
        {
            // #region agent log
            try
            {
                var logPath = Path.Combine(Directory.GetCurrentDirectory(), ".cursor", "debug.log");
                var logDir = Path.GetDirectoryName(logPath);
                if (!string.IsNullOrEmpty(logDir)) Directory.CreateDirectory(logDir);
                var received = request.ScheduledFor;
                var logLine = System.Text.Json.JsonSerializer.Serialize(new { location = "AlertsController.CreateAlert", message = "scheduledFor received", data = new { received = received?.ToString("O"), kind = received?.Kind.ToString(), utcNow = DateTime.UtcNow.ToString("O") }, timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), hypothesisId = "H2" }) + "\n";
                await System.IO.File.AppendAllTextAsync(logPath, logLine);
            }
            catch { }
            // #endregion

            if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Message) || string.IsNullOrWhiteSpace(request.TargetAudience))
            {
                return BadRequest(new { message = "Title, Message, and Target Audience are required." });
            }

            var validTypes = new[] { "Emergency", "Warning", "Information", "All Clear" };
            if (!validTypes.Contains(request.Type ?? ""))
            {
                return BadRequest(new { message = "Type must be one of: Emergency, Warning, Information, All Clear." });
            }

            var lastAlert = await _context.Alerts
                .OrderByDescending(a => a.AlertId)
                .FirstOrDefaultAsync();

            int nextId = 1;
            if (lastAlert != null && lastAlert.AlertId.StartsWith("ALERT"))
            {
                if (int.TryParse(lastAlert.AlertId.AsSpan(5), out int currentId))
                {
                    nextId = currentId + 1;
                }
            }
            var alertId = $"ALERT{nextId:D3}";

            var createdBy = await GetCurrentUserNameAsync();
            var now = DateTime.UtcNow;
            var isScheduled = request.ScheduledFor.HasValue && request.ScheduledFor.Value > now;
            var status = isScheduled ? "Scheduled" : "Sent";

            var alert = new Alert
            {
                AlertId = alertId,
                Title = request.Title.Trim(),
                Description = request.Message.Trim(),
                Severity = request.Type!,
                Status = status,
                TargetAudience = request.TargetAudience.Trim(),
                CreatedBy = createdBy,
                ScheduledFor = isScheduled ? request.ScheduledFor : null,
                SentAt = isScheduled ? null : now,
                CreatedAt = now,
                UpdatedAt = now
            };

            _context.Alerts.Add(alert);
            await _context.SaveChangesAsync();
            await LogAuditAsync("Create Alert", $"Created alert: {alert.Title} (ID: {alertId})");

            return CreatedAtAction(nameof(GetAlert), new { id = alertId }, new
            {
                id = alert.AlertId,
                title = alert.Title,
                message = alert.Description,
                type = alert.Severity,
                targetAudience = alert.TargetAudience,
                status = alert.Status,
                createdBy = alert.CreatedBy,
                scheduledFor = ToUtcIso(alert.ScheduledFor),
                sentAt = ToUtcIso(alert.SentAt),
                createdAt = ToUtcIso(alert.CreatedAt)
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAlert(string id, [FromBody] UpdateAlertRequest request)
        {
            var alert = await _context.Alerts.FindAsync(id);
            if (alert == null) return NotFound();

            if (alert.Status == "Sent")
            {
                return BadRequest(new { message = "Cannot update an alert that has already been sent." });
            }

            if (!string.IsNullOrWhiteSpace(request.Title))
                alert.Title = request.Title.Trim();
            if (!string.IsNullOrWhiteSpace(request.Message))
                alert.Description = request.Message.Trim();
            if (!string.IsNullOrWhiteSpace(request.Type))
            {
                var validTypes = new[] { "Emergency", "Warning", "Information", "All Clear" };
                if (validTypes.Contains(request.Type))
                    alert.Severity = request.Type;
            }
            if (!string.IsNullOrWhiteSpace(request.TargetAudience))
                alert.TargetAudience = request.TargetAudience.Trim();
            if (request.ScheduledFor.HasValue)
                alert.ScheduledFor = request.ScheduledFor;

            alert.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            await LogAuditAsync("Update Alert", $"Updated alert: {alert.Title} (ID: {id})");
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAlert(string id)
        {
            var alert = await _context.Alerts.FindAsync(id);
            if (alert == null) return NotFound();

            _context.Alerts.Remove(alert);
            await _context.SaveChangesAsync();
            await LogAuditAsync("Delete Alert", $"Deleted alert: {alert.Title} (ID: {id})");
            return NoContent();
        }

        [HttpPost("{id}/broadcast")]
        public async Task<ActionResult<object>> BroadcastAlert(string id)
        {
            var alert = await _context.Alerts.FindAsync(id);
            if (alert == null) return NotFound();

            if (alert.Status == "Sent")
            {
                return BadRequest(new { message = "Alert has already been broadcast." });
            }

            if (alert.Status == "Canceled")
            {
                return BadRequest(new { message = "Cannot broadcast a canceled alert." });
            }

            var now = DateTime.UtcNow;
            alert.Status = "Sent";
            alert.SentAt = now;
            alert.ScheduledFor = null;
            alert.UpdatedAt = now;
            await _context.SaveChangesAsync();
            await LogAuditAsync("Broadcast Alert", $"Broadcast alert: {alert.Title} (ID: {id})");

            return Ok(new
            {
                id = alert.AlertId,
                title = alert.Title,
                message = alert.Description,
                type = alert.Severity,
                targetAudience = alert.TargetAudience,
                status = alert.Status,
                createdBy = alert.CreatedBy,
                scheduledFor = ToUtcIso(null),
                sentAt = ToUtcIso(alert.SentAt),
                createdAt = ToUtcIso(alert.CreatedAt)
            });
        }

        [HttpPost("{id}/cancel")]
        public async Task<ActionResult<object>> CancelAlert(string id)
        {
            var alert = await _context.Alerts.FindAsync(id);
            if (alert == null) return NotFound();

            if (alert.Status == "Sent")
            {
                return BadRequest(new { message = "Cannot cancel an alert that has already been sent." });
            }

            alert.Status = "Canceled";
            alert.ScheduledFor = null;
            alert.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            await LogAuditAsync("Cancel Alert", $"Canceled scheduled alert: {alert.Title} (ID: {id})");

            return Ok(new
            {
                id = alert.AlertId,
                title = alert.Title,
                message = alert.Description,
                type = alert.Severity,
                targetAudience = alert.TargetAudience,
                status = alert.Status,
                createdBy = alert.CreatedBy,
                scheduledFor = ToUtcIso(null),
                sentAt = ToUtcIso(alert.SentAt),
                createdAt = ToUtcIso(alert.CreatedAt)
            });
        }

        private async Task<string> GetCurrentUserNameAsync()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return "Unknown";
            var user = await _userManager.FindByIdAsync(userId);
            return user?.Name ?? "Unknown";
        }

        private async Task LogAuditAsync(string action, string details)
        {
            var user = await _userManager.GetUserAsync(User);
            var auditLog = new AuditLog
            {
                Id = await AuditLog.GenerateNextIdAsync(_context),
                Username = user?.UserName ?? "Unknown",
                Name = user?.Name ?? "Unknown",
                Action = action,
                Module = "Alert Broadcasting",
                Details = details,
                Timestamp = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();
        }
    }

    public class CreateAlertRequest
    {
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;
        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;
        [JsonPropertyName("type")]
        public string Type { get; set; } = "Information";
        [JsonPropertyName("targetAudience")]
        public string TargetAudience { get; set; } = string.Empty;
        [JsonPropertyName("scheduledFor")]
        public DateTime? ScheduledFor { get; set; }
    }

    public class UpdateAlertRequest
    {
        [JsonPropertyName("title")]
        public string? Title { get; set; }
        [JsonPropertyName("message")]
        public string? Message { get; set; }
        [JsonPropertyName("type")]
        public string? Type { get; set; }
        [JsonPropertyName("targetAudience")]
        public string? TargetAudience { get; set; }
        [JsonPropertyName("scheduledFor")]
        public DateTime? ScheduledFor { get; set; }
    }
}
