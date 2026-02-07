using FYP_Project_II.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FYP_Project_II.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuditLogController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AuditLogController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAuditLogs()
        {
            var logs = await _context.AuditLogs
                .OrderByDescending(l => l.Timestamp)
                .Select(l => new
                {
                    id = l.Id.ToString(),
                    userId = l.UserId,
                    userName = l.UserName,
                    action = l.Action,
                    module = l.Module,
                    details = l.Details,
                    timestamp = l.Timestamp.ToString("o")
                })
                .ToListAsync();

            return Ok(logs);
        }
    }
}
