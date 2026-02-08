using FYP_Project_II.Data;
using FYP_Project_II.Models;
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
        [Authorize(Roles = "Admin, System Admin")]
        public async Task<IActionResult> GetAuditLogs()
        {
            // Create an instance of Admin to access the ViewAuditLogs method
            // In a real application, you might use dependency injection or the current user's instance
            var admin = new Admin();
            
            // Delegate the logic to the Admin model
            var logs = await admin.ViewAuditLogs(_context);

            // Map the results to the anonymous type expected by the frontend
            var response = logs.Select(l => new
            {
                id = l.Id.ToString(),
                username = l.Username,
                name = l.Name,
                action = l.Action,
                module = l.Module,
                details = l.Details,
                timestamp = l.Timestamp.ToString("o")
            });

            return Ok(response);
        }
    }
}
