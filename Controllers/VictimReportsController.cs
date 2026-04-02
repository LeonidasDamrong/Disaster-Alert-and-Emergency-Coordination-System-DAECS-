using System.Collections.Generic;
using FYP_Project_II.Data;
using FYP_Project_II.Hubs;
using FYP_Project_II.Models;
using FYP_Project_II.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Security.Claims;
using System.Text.Json.Serialization;

namespace FYP_Project_II.Controllers
{
    [ApiController]
    public class VictimReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IHubContext<NotificationHub> _notificationHub;
        private readonly IFcmSender _fcmSender;

        public VictimReportsController(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            IHubContext<NotificationHub> notificationHub,
            IFcmSender fcmSender)
        {
            _context = context;
            _userManager = userManager;
            _notificationHub = notificationHub;
            _fcmSender = fcmSender;
        }

        private static string? ToUtcIso(DateTime? dt) =>
            dt.HasValue
                ? dt.Value.Kind == DateTimeKind.Utc
                    ? dt.Value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                    : DateTime.SpecifyKind(dt.Value, DateTimeKind.Utc).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                : null;

        /// <summary>Mobile (Flutter) — submit a victim/community report for admin review.</summary>
        [HttpPost("/api/mobile/victim-reports")]
        [AllowAnonymous]
        public async Task<ActionResult<object>> SubmitMobileReport([FromBody] SubmitVictimReportRequest request)
        {
            if (request == null) return BadRequest(new { message = "Request body is required." });

            if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Description))
                return BadRequest(new { message = "title and description are required." });

            if (!request.Lat.HasValue || !request.Lng.HasValue)
                return BadRequest(new { message = "lat and lng are required." });

            var lat = (decimal)request.Lat.Value;
            var lng = (decimal)request.Lng.Value;
            if (lat < -90 || lat > 90 || lng < -180 || lng > 180)
                return BadRequest(new { message = "lat/lng out of range." });

            var now = DateTime.UtcNow;
            var id = await GenerateNextVictimReportIdAsync();

            var report = new VictimReport
            {
                VictimReportId = id,
                Title = request.Title.Trim(),
                Description = request.Description.Trim(),
                Category = string.IsNullOrWhiteSpace(request.Category) ? "General" : request.Category.Trim(),
                Severity = string.IsNullOrWhiteSpace(request.Severity) ? "Medium" : request.Severity.Trim(),
                Latitude = lat,
                Longitude = lng,
                LocationName = string.IsNullOrWhiteSpace(request.LocationName) ? "User Reported Location" : request.LocationName.Trim(),
                SafetyInfo = string.IsNullOrWhiteSpace(request.SafetyInfo)
                    ? "Reported by community. Proceed with caution."
                    : request.SafetyInfo.Trim(),
                Source = string.IsNullOrWhiteSpace(request.Source) ? "Community" : request.Source.Trim(),
                ReporterEmail = request.ReporterEmail?.Trim() ?? "",
                ReporterName = request.ReporterName?.Trim() ?? "",
                HasEvidence = request.HasEvidence ?? false,
                ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim(),
                Status = "Pending",
                CreatedAt = now,
                UpdatedAt = now
            };

            _context.VictimReports.Add(report);
            await _context.SaveChangesAsync();

            return StatusCode(StatusCodes.Status201Created, new
            {
                id = report.VictimReportId,
                status = report.Status,
                createdAt = ToUtcIso(report.CreatedAt)
            });
        }

        [HttpGet("/api/victim-reports")]
        [Authorize(Roles = "Admin, System Admin")]
        public async Task<ActionResult<IEnumerable<object>>> ListReports([FromQuery] string? status)
        {
            var q = _context.VictimReports.AsNoTracking().AsQueryable();
            if (!string.IsNullOrWhiteSpace(status))
                q = q.Where(r => r.Status == status);

            var list = await q.OrderByDescending(r => r.CreatedAt).ToListAsync();
            return Ok(list.Select(MapReportToDto));
        }

        [HttpGet("/api/victim-reports/{id}")]
        [Authorize(Roles = "Admin, System Admin")]
        public async Task<ActionResult<object>> GetReport(string id)
        {
            var r = await _context.VictimReports.AsNoTracking().FirstOrDefaultAsync(x => x.VictimReportId == id);
            if (r == null) return NotFound();
            return Ok(MapReportToDto(r));
        }

        /// <summary>Approve a pending report and broadcast it as an alert (same shape as manual alert creation).</summary>
        [HttpPost("/api/victim-reports/{id}/approve")]
        [Authorize(Roles = "Admin, System Admin")]
        public async Task<ActionResult<object>> ApproveReport(string id, [FromBody] ApproveVictimReportRequest? body)
        {
            var report = await _context.VictimReports.FirstOrDefaultAsync(r => r.VictimReportId == id);
            if (report == null) return NotFound();

            if (report.Status != "Pending")
                return BadRequest(new { message = $"Report is not pending (current status: {report.Status})." });

            var title = string.IsNullOrWhiteSpace(body?.Title) ? report.Title : body!.Title.Trim();
            var message = string.IsNullOrWhiteSpace(body?.Message) ? BuildDefaultAlertMessage(report) : body!.Message.Trim();
            var alertType = string.IsNullOrWhiteSpace(body?.Type)
                ? MapSeverityToAlertType(report.Severity)
                : body!.Type.Trim();
            var targetAudience = string.IsNullOrWhiteSpace(body?.TargetAudience)
                ? report.LocationName
                : body!.TargetAudience.Trim();

            var validTypes = new[] { "Emergency", "Warning", "Information", "All Clear" };
            if (!validTypes.Contains(alertType))
                return BadRequest(new { message = "type must be one of: Emergency, Warning, Information, All Clear." });

            var now = DateTime.UtcNow;
            var scheduledFor = body?.ScheduledFor;
            var isScheduled = scheduledFor.HasValue && scheduledFor.Value > now;
            var alertStatus = isScheduled ? "Scheduled" : "Sent";

            var alertId = await GenerateNextAlertIdAsync();
            var createdBy = await GetCurrentUserNameAsync();

            var alert = new Alert
            {
                AlertId = alertId,
                Title = title,
                Description = message,
                Severity = alertType,
                Status = alertStatus,
                TargetAudience = targetAudience,
                CreatedBy = createdBy,
                ScheduledFor = isScheduled ? scheduledFor : null,
                SentAt = isScheduled ? null : now,
                CreatedAt = now,
                UpdatedAt = now,
                SourceVictimReportId = report.VictimReportId
            };

            _context.Alerts.Add(alert);

            report.Status = "Approved";
            report.ReviewedAt = now;
            report.ReviewedBy = createdBy;
            report.RejectionReason = null;
            report.CreatedAlertId = alertId;
            report.UpdatedAt = now;

            await _context.SaveChangesAsync();
            await LogAuditAsync("Approve Victim Report", $"Approved report {id} → alert {alertId}");

            if (alertStatus == "Sent")
            {
                await _notificationHub.Clients.All.SendAsync("AlertBroadcast", new
                {
                    id = alert.AlertId,
                    title = alert.Title,
                    message = alert.Description,
                    type = alert.Severity,
                    targetAudience = alert.TargetAudience,
                    createdBy = alert.CreatedBy,
                    sentAt = alert.SentAt
                });
                await _fcmSender.SendAlertPushAsync(alert.AlertId, alert.Title, alert.Description);
            }

            return Ok(new
            {
                victimReportId = report.VictimReportId,
                alert = new
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
                    createdAt = ToUtcIso(alert.CreatedAt),
                    sourceVictimReportId = alert.SourceVictimReportId
                }
            });
        }

        [HttpPost("/api/victim-reports/{id}/reject")]
        [Authorize(Roles = "Admin, System Admin")]
        public async Task<ActionResult<object>> RejectReport(string id, [FromBody] RejectVictimReportRequest? body)
        {
            var report = await _context.VictimReports.FirstOrDefaultAsync(r => r.VictimReportId == id);
            if (report == null) return NotFound();

            if (report.Status != "Pending")
                return BadRequest(new { message = $"Report is not pending (current status: {report.Status})." });

            var now = DateTime.UtcNow;
            var reviewer = await GetCurrentUserNameAsync();

            report.Status = "Rejected";
            report.ReviewedAt = now;
            report.ReviewedBy = reviewer;
            report.RejectionReason = string.IsNullOrWhiteSpace(body?.Reason) ? null : body!.Reason.Trim();
            report.UpdatedAt = now;

            await _context.SaveChangesAsync();
            await LogAuditAsync("Reject Victim Report", $"Rejected report {id}. Reason: {report.RejectionReason ?? "(none)"}");

            return Ok(new
            {
                id = report.VictimReportId,
                status = report.Status,
                reviewedAt = ToUtcIso(report.ReviewedAt),
                rejectionReason = report.RejectionReason
            });
        }

        private static object MapReportToDto(VictimReport r) => new
        {
            id = r.VictimReportId,
            title = r.Title,
            description = r.Description,
            category = r.Category,
            severity = r.Severity,
            lat = r.Latitude,
            lng = r.Longitude,
            locationName = r.LocationName,
            safetyInfo = r.SafetyInfo,
            source = r.Source,
            reporterEmail = r.ReporterEmail,
            reporterName = r.ReporterName,
            hasEvidence = r.HasEvidence,
            imageUrl = r.ImageUrl,
            status = r.Status,
            createdAt = ToUtcIso(r.CreatedAt),
            updatedAt = ToUtcIso(r.UpdatedAt),
            reviewedAt = ToUtcIso(r.ReviewedAt),
            reviewedBy = r.ReviewedBy,
            rejectionReason = r.RejectionReason,
            createdAlertId = r.CreatedAlertId
        };

        private static string BuildDefaultAlertMessage(VictimReport r)
        {
            var parts = new List<string> { r.Description.Trim() };
            if (!string.IsNullOrWhiteSpace(r.Category))
                parts.Add($"Category: {r.Category}");
            if (!string.IsNullOrWhiteSpace(r.SafetyInfo))
                parts.Add(r.SafetyInfo.Trim());
            parts.Add($"Location: {r.LocationName} ({r.Latitude.ToString(CultureInfo.InvariantCulture)}, {r.Longitude.ToString(CultureInfo.InvariantCulture)})");
            return string.Join("\n\n", parts);
        }

        private static string MapSeverityToAlertType(string severity)
        {
            if (string.IsNullOrWhiteSpace(severity)) return "Warning";
            var s = severity.Trim();
            if (s.Equals("Critical", StringComparison.OrdinalIgnoreCase)) return "Emergency";
            if (s.Equals("High", StringComparison.OrdinalIgnoreCase)) return "Warning";
            if (s.Equals("Medium", StringComparison.OrdinalIgnoreCase)) return "Warning";
            if (s.Equals("Low", StringComparison.OrdinalIgnoreCase)) return "Information";
            return "Warning";
        }

        private async Task<string> GenerateNextVictimReportIdAsync()
        {
            const string prefix = "VRPT";
            var last = await _context.VictimReports
                .Where(v => v.VictimReportId.StartsWith(prefix))
                .OrderByDescending(v => v.VictimReportId.Length)
                .ThenByDescending(v => v.VictimReportId)
                .Select(v => v.VictimReportId)
                .FirstOrDefaultAsync();

            var next = 1;
            if (!string.IsNullOrEmpty(last) && int.TryParse(last.AsSpan(prefix.Length), out var n))
                next = n + 1;
            return $"{prefix}{next:D4}";
        }

        private async Task<string> GenerateNextAlertIdAsync()
        {
            var lastAlert = await _context.Alerts
                .OrderByDescending(a => a.AlertId)
                .FirstOrDefaultAsync();

            int nextId = 1;
            if (lastAlert != null && lastAlert.AlertId.StartsWith("ALERT", StringComparison.Ordinal))
            {
                if (int.TryParse(lastAlert.AlertId.AsSpan(5), out int currentId))
                    nextId = currentId + 1;
            }
            return $"ALERT{nextId:D3}";
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

    public class SubmitVictimReportRequest
    {
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;
        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;
        [JsonPropertyName("category")]
        public string? Category { get; set; }
        [JsonPropertyName("severity")]
        public string? Severity { get; set; }
        [JsonPropertyName("lat")]
        public double? Lat { get; set; }
        [JsonPropertyName("lng")]
        public double? Lng { get; set; }
        [JsonPropertyName("locationName")]
        public string? LocationName { get; set; }
        [JsonPropertyName("safetyInfo")]
        public string? SafetyInfo { get; set; }
        [JsonPropertyName("source")]
        public string? Source { get; set; }
        [JsonPropertyName("reporterEmail")]
        public string? ReporterEmail { get; set; }
        [JsonPropertyName("reporterName")]
        public string? ReporterName { get; set; }
        [JsonPropertyName("hasEvidence")]
        public bool? HasEvidence { get; set; }
        [JsonPropertyName("imageUrl")]
        public string? ImageUrl { get; set; }
    }

    public class ApproveVictimReportRequest
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

    public class RejectVictimReportRequest
    {
        [JsonPropertyName("reason")]
        public string? Reason { get; set; }
    }
}
