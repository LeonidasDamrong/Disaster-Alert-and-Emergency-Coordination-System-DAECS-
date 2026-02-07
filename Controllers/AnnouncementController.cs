using FYP_Project_II.Data;
using FYP_Project_II.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FYP_Project_II.Controllers
{
    [Route("api/announcements")]
    [ApiController]
    public class AnnouncementController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public AnnouncementController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Announcement>>> GetAnnouncements()
        {
            return await _context.Announcements
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Announcement>> GetAnnouncement(string id)
        {
            var announcement = await _context.Announcements.FindAsync(id);
            if (announcement == null) return NotFound();
            return announcement;
        }

        [HttpPost]
        [Authorize(Roles = "Admin, System Admin")]
        public async Task<ActionResult<Announcement>> CreateAnnouncement(Announcement announcement)
        {
            // Generate Custom ID: ANNXXX
            var lastAnnouncement = await _context.Announcements
                .OrderByDescending(a => a.Id)
                .FirstOrDefaultAsync();

            int nextId = 1;
            if (lastAnnouncement != null && lastAnnouncement.Id.StartsWith("ANN"))
            {
                if (int.TryParse(lastAnnouncement.Id.Substring(3), out int currentId))
                {
                    nextId = currentId + 1;
                }
            }
            announcement.Id = $"ANN{nextId:D3}";

            announcement.CreatedAt = DateTime.UtcNow;
            
            // Get current user name for CreatedBy
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                var user = await _userManager.FindByIdAsync(userId);
                announcement.CreatedBy = user?.Name ?? "Unknown";
            }
            else
            {
                announcement.CreatedBy = "System";
            }

            _context.Announcements.Add(announcement);
            await _context.SaveChangesAsync();

            await LogAuditAsync("Create Announcement", $"Created announcement: {announcement.Title}");

            return CreatedAtAction(nameof(GetAnnouncement), new { id = announcement.Id }, announcement);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin, System Admin")]
        public async Task<IActionResult> UpdateAnnouncement(string id, Announcement announcement)
        {
            if (id != announcement.Id) return BadRequest();

            var existing = await _context.Announcements.FindAsync(id);
            if (existing == null) return NotFound();

            existing.Title = announcement.Title;
            existing.Content = announcement.Content;
            existing.Priority = announcement.Priority;
            existing.IsActive = announcement.IsActive;
            existing.ExpiresAt = announcement.ExpiresAt;

            try
            {
                await _context.SaveChangesAsync();
                await LogAuditAsync("Update Announcement", $"Updated announcement: {announcement.Title}");
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!AnnouncementExists(id)) return NotFound();
                else throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin, System Admin")]
        public async Task<IActionResult> DeleteAnnouncement(string id)
        {
            var announcement = await _context.Announcements.FindAsync(id);
            if (announcement == null) return NotFound();

            _context.Announcements.Remove(announcement);
            await _context.SaveChangesAsync();
            await LogAuditAsync("Delete Announcement", $"Deleted announcement: {announcement.Title}");

            return NoContent();
        }

        private bool AnnouncementExists(string id)
        {
            return _context.Announcements.Any(e => e.Id == id);
        }

         private async Task LogAuditAsync(string action, string details)
        {
            // Generate Custom ID: LOGXXX
            var lastLog = await _context.AuditLogs
                .OrderByDescending(l => l.Id)
                .FirstOrDefaultAsync();

            int nextId = 1;
            if (lastLog != null && lastLog.Id.StartsWith("LOG"))
            {
                if (int.TryParse(lastLog.Id.Substring(3), out int currentId))
                {
                    nextId = currentId + 1;
                }
            }

            var user = await _userManager.GetUserAsync(User);
            var auditLog = new AuditLog
            {
                Id = $"LOG{nextId:D3}",
                Username = user?.UserName ?? "Unknown",
                Name = user?.Name ?? "Unknown",
                Action = action,
                Module = "Announcement Management",
                Details = details,
                Timestamp = DateTime.UtcNow
            };

            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();
        }
    }
}
