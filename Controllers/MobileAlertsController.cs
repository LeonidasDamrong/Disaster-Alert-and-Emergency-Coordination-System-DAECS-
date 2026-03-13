using FYP_Project_II.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FYP_Project_II.Controllers
{
    [Route("api/mobile/alerts")]
    [ApiController]
    [AllowAnonymous]
    public class MobileAlertsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MobileAlertsController(ApplicationDbContext context)
        {
            _context = context;
        }

        private static string? ToUtcIso(DateTime? dt) =>
            dt.HasValue
                ? dt.Value.Kind == DateTimeKind.Utc
                    ? dt.Value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                    : DateTime.SpecifyKind(dt.Value, DateTimeKind.Utc).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                : null;

        /// <summary>
        /// GET api/mobile/alerts
        /// Optional query: active (bool). active=true = only Sent; active=false = only non-Sent (Scheduled, Canceled); omit = all.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetAlerts([FromQuery] bool? active)
        {
            var query = _context.Alerts.AsNoTracking();

            if (active == true)
                query = query.Where(a => a.Status == "Sent");
            else if (active == false)
                query = query.Where(a => a.Status != "Sent");

            var alerts = await query
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new
                {
                    id = a.AlertId,
                    title = a.Title,
                    message = a.Description,
                    type = a.Severity,
                    targetAudience = a.TargetAudience,
                    status = a.Status,
                    createdBy = a.CreatedBy ?? "Unknown",
                    scheduledFor = a.ScheduledFor,
                    sentAt = a.SentAt,
                    createdAt = a.CreatedAt
                })
                .ToListAsync();

            var result = alerts.Select(a => new
            {
                a.id,
                a.title,
                a.message,
                a.type,
                a.targetAudience,
                a.status,
                a.createdBy,
                scheduledFor = ToUtcIso(a.scheduledFor),
                sentAt = ToUtcIso(a.sentAt),
                createdAt = ToUtcIso(a.createdAt)
            }).ToList();

            return Ok(result);
        }

        /// <summary>
        /// GET api/mobile/alerts/{id}
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetAlert(string id)
        {
            var alert = await _context.Alerts
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.AlertId == id);

            if (alert == null)
                return NotFound();

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
    }
}
