using FYP_Project_II.Data;
using FYP_Project_II.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FYP_Project_II.Controllers
{
    [Route("api/system-settings")]
    [ApiController]
    [Authorize]
    public class SystemSettingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public SystemSettingsController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        // GET: api/system-settings
        [HttpGet]
        public async Task<ActionResult<SystemSettings>> GetSettings()
        {
            var settings = await _context.SystemSettings.FirstOrDefaultAsync();

            if (settings == null)
            {
                // If no settings exist, create default
                settings = new SystemSettings();
                _context.SystemSettings.Add(settings);
                await _context.SaveChangesAsync();
            }

            return settings;
        }

        // PUT: api/system-settings
        [HttpPut]
        [Authorize(Roles = "System Admin")]
        public async Task<IActionResult> UpdateSettings([FromBody] SystemSettings settings)
        {
            if (settings == null)
            {
                return BadRequest("Settings cannot be null");
            }

            var existingSettings = await _context.SystemSettings.FirstOrDefaultAsync();

            if (existingSettings == null)
            {
                existingSettings = new SystemSettings();
                _context.SystemSettings.Add(existingSettings);
            }

            // Update fields
            if (!string.IsNullOrEmpty(settings.SystemName)) existingSettings.SystemName = settings.SystemName;
            if (!string.IsNullOrEmpty(settings.OrganizationName)) existingSettings.OrganizationName = settings.OrganizationName;
            if (!string.IsNullOrEmpty(settings.EmergencyContactNumber)) existingSettings.EmergencyContactNumber = settings.EmergencyContactNumber;
            
            existingSettings.EnableNotifications = settings.EnableNotifications;
            existingSettings.UpdatedAt = DateTime.UtcNow;

            // Audit Log
            var user = await _userManager.GetUserAsync(User);
            var auditLog = new AuditLog
            {
                Id = await AuditLog.GenerateNextIdAsync(_context),
                Username = user?.UserName ?? "Unknown",
                Name = user?.Name ?? "Unknown",
                Action = "Update System Settings",
                Module = "Admin Management",
                Details = "System Settings Updated",
                Timestamp = DateTime.UtcNow
            };

            _context.AuditLogs.Add(auditLog);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
