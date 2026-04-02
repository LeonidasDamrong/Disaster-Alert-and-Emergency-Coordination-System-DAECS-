using FYP_Project_II.Data;
using FYP_Project_II.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FYP_Project_II.Controllers
{
    public class RejectRequestDto
    {
        public string? RejectionReason { get; set; }
    }



    [Route("api/shelters")]
    [ApiController]
    public class ShelterController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public ShelterController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        // ---------- Shelters ----------
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Shelter>>> GetShelters()
        {
            return await _context.Shelters
                .Include(s => s.ShelterResources)
                .Include(s => s.Evacuees)
                .OrderBy(s => s.ShelterName)
                .ToListAsync();
        }

        /// <summary>Get the shelter assigned to the current user (Shelter Manager). Returns 404 if none.</summary>
        [HttpGet("my-shelter")]
        [Authorize]
        public async Task<ActionResult<Shelter>> GetMyShelter()
        {
            var userName = User.FindFirst(ClaimTypes.Name)?.Value ?? User.Identity?.Name;
            if (string.IsNullOrEmpty(userName)) return Unauthorized();

            var shelter = await _context.Shelters
                .Include(s => s.ShelterResources)
                .Include(s => s.Evacuees)
                .FirstOrDefaultAsync(s => s.ManagedBy == userName);
            if (shelter == null) return NotFound();
            return shelter;
        }

        // ---------- Shelter Registration Requests ----------
        [HttpGet("registration-requests")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<ShelterRegistrationRequest>>> GetRegistrationRequests([FromQuery] bool myOnly = false)
        {
            var userName = User.FindFirst(ClaimTypes.Name)?.Value ?? User.Identity?.Name;
            if (string.IsNullOrEmpty(userName)) return Unauthorized();

            var query = _context.ShelterRegistrationRequests.AsQueryable();
            if (myOnly)
                query = query.Where(r => r.RequestedBy == userName);
            return await query.OrderByDescending(r => r.RequestedAt).ToListAsync();
        }

        [HttpPost("registration-requests")]
        [Authorize(Roles = "Shelter Manager")]
        public async Task<ActionResult<ShelterRegistrationRequest>> CreateRegistrationRequest(ShelterRegistrationRequest request)
        {
            var userName = User.FindFirst(ClaimTypes.Name)?.Value ?? User.Identity?.Name;
            if (string.IsNullOrEmpty(userName)) return Unauthorized();

            var hasShelter = await _context.Shelters.AnyAsync(s => s.ManagedBy == userName);
            if (hasShelter)
                return BadRequest(new { message = "You are already assigned to a shelter." });

            request.RequestId = await GenerateNextRequestIdAsync();
            request.RequestedBy = userName;
            request.Status = "Pending";
            request.RequestedAt = DateTime.UtcNow;
            request.ProcessedAt = null;
            request.ProcessedBy = null;
            request.RejectionReason = null;

            _context.ShelterRegistrationRequests.Add(request);
            await _context.SaveChangesAsync();
            await LogAuditAsync("Shelter Registration Request", $"Requested registration: {request.ShelterName}");

            return CreatedAtAction(nameof(GetRegistrationRequests), null, request);
        }

        [HttpPost("registration-requests/{requestId}/approve")]
        [Authorize(Roles = "Admin, System Admin")]
        public async Task<ActionResult<Shelter>> ApproveRegistrationRequest(string requestId)
        {
            var req = await _context.ShelterRegistrationRequests.FindAsync(requestId);
            if (req == null) return NotFound();
            if (req.Status != "Pending")
                return BadRequest(new { message = "Request has already been processed." });

            var shelter = new Shelter
            {
                ShelterId = await GenerateNextShelterIdAsync(),
                ShelterName = req.ShelterName,
                Address = req.Address,
                Latitude = req.Latitude,
                Longitude = req.Longitude,
                TotalCapacity = req.TotalCapacity,
                AvailableCapacity = req.TotalCapacity,
                Status = "Open",
                ManagedBy = req.RequestedBy,
                RegisteredAt = DateTime.UtcNow,
                LastModifiedAt = DateTime.UtcNow
            };
            _context.Shelters.Add(shelter);

            req.Status = "Approved";
            req.ProcessedAt = DateTime.UtcNow;
            req.ProcessedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? User.Identity?.Name;

            await _context.SaveChangesAsync();
            await LogAuditAsync("Approve Shelter Registration", $"Approved request {requestId}, created shelter {shelter.ShelterId}");

            return Ok(shelter);
        }

        [HttpPost("registration-requests/{requestId}/reject")]
        [Authorize(Roles = "Admin, System Admin")]
        public async Task<IActionResult> RejectRegistrationRequest(string requestId, [FromBody] RejectRequestDto? dto)
        {
            var req = await _context.ShelterRegistrationRequests.FindAsync(requestId);
            if (req == null) return NotFound();
            if (req.Status != "Pending")
                return BadRequest(new { message = "Request has already been processed." });

            req.Status = "Rejected";
            req.ProcessedAt = DateTime.UtcNow;
            req.ProcessedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? User.Identity?.Name;
            req.RejectionReason = dto?.RejectionReason;

            await _context.SaveChangesAsync();
            await LogAuditAsync("Reject Shelter Registration", $"Rejected request {requestId}");

            return NoContent();
        }

        [HttpGet("{shelterId}")]
        public async Task<ActionResult<Shelter>> GetShelter(string shelterId)
        {
            var shelter = await _context.Shelters.FindAsync(shelterId);
            if (shelter == null) return NotFound();
            return shelter;
        }

        [HttpGet("{shelterId}/full")]
        public async Task<ActionResult<object>> GetShelterWithDetails(string shelterId)
        {
            var shelter = await _context.Shelters.FindAsync(shelterId);
            if (shelter == null) return NotFound();

            var evacuees = await _context.Evacuees
                .Where(e => e.ShelterId == shelterId && e.EvacueeCheckOutDate == null)
                .ToListAsync();
            var resources = await _context.ShelterResources
                .Where(r => r.ShelterId == shelterId)
                .ToListAsync();

            return Ok(new
            {
                shelter,
                evacuees,
                resources
            });
        }

        [HttpPost]
        [Authorize(Roles = "Admin, System Admin")]
        public async Task<ActionResult<Shelter>> CreateShelter(Shelter shelter)
        {
            shelter.ShelterId = await GenerateNextShelterIdAsync();
            shelter.RegisteredAt = DateTime.UtcNow;
            shelter.LastModifiedAt = DateTime.UtcNow;
            shelter.AvailableCapacity = shelter.TotalCapacity;

            _context.Shelters.Add(shelter);
            await _context.SaveChangesAsync();
            await LogAuditAsync("Create Shelter", $"Created shelter: {shelter.ShelterName}");

            return CreatedAtAction(nameof(GetShelter), new { shelterId = shelter.ShelterId }, shelter);
        }

        [HttpPut("{shelterId}")]
        [Authorize(Roles = "Admin, System Admin")]
        public async Task<IActionResult> UpdateShelter(string shelterId, Shelter shelter)
        {
            if (shelterId != shelter.ShelterId) return BadRequest();

            var existing = await _context.Shelters.FindAsync(shelterId);
            if (existing == null) return NotFound();

            existing.ShelterName = shelter.ShelterName;
            existing.Address = shelter.Address;
            existing.Latitude = shelter.Latitude;
            existing.Longitude = shelter.Longitude;
            existing.TotalCapacity = shelter.TotalCapacity;
            existing.Status = shelter.Status;
            existing.ManagedBy = shelter.ManagedBy;
            existing.AvailableCapacity = shelter.AvailableCapacity;
            existing.LastModifiedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
                await LogAuditAsync("Update Shelter", $"Updated shelter: {shelter.ShelterName}");
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ShelterExists(shelterId)) return NotFound();
                throw;
            }

            return NoContent();
        }

        [HttpDelete("{shelterId}")]
        [Authorize(Roles = "Admin, System Admin")]
        public async Task<IActionResult> DeleteShelter(string shelterId)
        {
            var shelter = await _context.Shelters.FindAsync(shelterId);
            if (shelter == null) return NotFound();

            var hasEvacuees = await _context.Evacuees.AnyAsync(e => e.ShelterId == shelterId && e.EvacueeCheckOutDate == null);
            if (hasEvacuees)
                return BadRequest(new { message = "Cannot delete shelter with active evacuees. Check out all evacuees first." });

            _context.ShelterResources.RemoveRange(await _context.ShelterResources.Where(r => r.ShelterId == shelterId).ToListAsync());
            _context.ShelterReports.RemoveRange(await _context.ShelterReports.Where(r => r.ShelterId == shelterId).ToListAsync());
            _context.Shelters.Remove(shelter);
            await _context.SaveChangesAsync();
            await LogAuditAsync("Delete Shelter", $"Deleted shelter: {shelter.ShelterName}");

            return NoContent();
        }

        // ---------- Evacuees ----------
        [HttpGet("{shelterId}/evacuees")]
        public async Task<ActionResult<IEnumerable<Evacuee>>> GetEvacuees(string shelterId, [FromQuery] bool activeOnly = true)
        {
            if (!ShelterExists(shelterId)) return NotFound();

            var query = _context.Evacuees.Where(e => e.ShelterId == shelterId);
            if (activeOnly)
                query = query.Where(e => e.EvacueeCheckOutDate == null);

            return await query.OrderByDescending(e => e.EvacueeCheckInDate).ToListAsync();
        }

        [HttpPost("{shelterId}/evacuees")]
        [Authorize]
        public async Task<ActionResult<Evacuee>> RegisterEvacuee(string shelterId, Evacuee evacuee)
        {
            var shelter = await _context.Shelters.FindAsync(shelterId);
            if (shelter == null) return NotFound();
            if (shelter.AvailableCapacity <= 0)
                return BadRequest(new { message = "Shelter has no available capacity." });

            evacuee.EvacueeId = await GenerateNextEvacueeIdAsync();
            evacuee.ShelterId = shelterId;
            evacuee.EvacueeCheckInDate = DateTime.UtcNow;
            evacuee.EvacueeCheckOutDate = null;

            _context.Evacuees.Add(evacuee);
            shelter.AvailableCapacity--;
            if (shelter.AvailableCapacity == 0)
                shelter.Status = "Full";
            shelter.LastModifiedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await LogAuditAsync("Register Evacuee", $"Registered evacuee {evacuee.EvacueeName} at {shelter.ShelterName}");

            return CreatedAtAction(nameof(GetEvacuees), new { shelterId }, evacuee);
        }

        [HttpPut("{shelterId}/evacuees/{evacueeId}")]
        [Authorize]
        public async Task<IActionResult> UpdateEvacuee(string shelterId, string evacueeId, Evacuee evacuee)
        {
            if (evacueeId != evacuee.EvacueeId || shelterId != evacuee.ShelterId) return BadRequest();

            var existing = await _context.Evacuees.FindAsync(evacueeId);
            if (existing == null || existing.ShelterId != shelterId) return NotFound();

            existing.EvacueeName = evacuee.EvacueeName;
            existing.EvacueeIdNumber = evacuee.EvacueeIdNumber;
            existing.EvacueeGender = evacuee.EvacueeGender;
            existing.EvacueeAge = evacuee.EvacueeAge;
            existing.EvacueePhone = evacuee.EvacueePhone;
            existing.EvacueeMedicalNeeds = evacuee.EvacueeMedicalNeeds;
            existing.EvacueeCheckOutDate = evacuee.EvacueeCheckOutDate;

            await _context.SaveChangesAsync();
            await LogAuditAsync("Update Evacuee", $"Updated evacuee {evacuee.EvacueeName}");

            return NoContent();
        }



        [HttpPost("{shelterId}/evacuees/{evacueeId}/checkout")]
        [Authorize]
        public async Task<IActionResult> CheckOutEvacuee(string shelterId, string evacueeId)
        {
            var evacuee = await _context.Evacuees.FindAsync(evacueeId);
            if (evacuee == null || evacuee.ShelterId != shelterId) return NotFound();
            if (evacuee.EvacueeCheckOutDate.HasValue)
                return BadRequest(new { message = "Evacuee already checked out." });

            var shelter = await _context.Shelters.FindAsync(shelterId);
            if (shelter == null) return NotFound();

            evacuee.EvacueeCheckOutDate = DateTime.UtcNow;
            shelter.AvailableCapacity++;
            if (shelter.Status == "Full")
                shelter.Status = "Open";
            shelter.LastModifiedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await LogAuditAsync("Check Out Evacuee", $"Checked out {evacuee.EvacueeName} from {shelter.ShelterName}");

            return NoContent();
        }

        // ---------- Shelter Resources ----------
        [HttpGet("{shelterId}/resources")]
        public async Task<ActionResult<IEnumerable<ShelterResource>>> GetShelterResources(string shelterId)
        {
            if (!ShelterExists(shelterId)) return NotFound();
            return await _context.ShelterResources
                .Where(r => r.ShelterId == shelterId)
                .OrderBy(r => r.ResourceType)
                .ToListAsync();
        }

        [HttpPost("{shelterId}/resources")]
        [Authorize]
        public async Task<ActionResult<ShelterResource>> AddShelterResource(string shelterId, ShelterResource resource)
        {
            var shelter = await _context.Shelters.FindAsync(shelterId);
            if (shelter == null) return NotFound();

            resource.ShelterResourceId = await GenerateNextShelterResourceIdAsync();
            resource.ShelterId = shelterId;
            resource.CreatedAt = DateTime.UtcNow;
            resource.UpdatedAt = DateTime.UtcNow;

            _context.ShelterResources.Add(resource);
            await _context.SaveChangesAsync();
            await LogAuditAsync("Add Shelter Resource", $"Added {resource.ResourceType} x{resource.Quantity} to {shelter.ShelterName}");

            return CreatedAtAction(nameof(GetShelterResources), new { shelterId }, resource);
        }

        [HttpPut("{shelterId}/resources/{resourceId}")]
        [Authorize]
        public async Task<IActionResult> UpdateShelterResource(string shelterId, string resourceId, ShelterResource resource)
        {
            if (resourceId != resource.ShelterResourceId || shelterId != resource.ShelterId) return BadRequest();

            var existing = await _context.ShelterResources.FindAsync(resourceId);
            if (existing == null || existing.ShelterId != shelterId) return NotFound();

            existing.ResourceType = resource.ResourceType;
            existing.Quantity = resource.Quantity;
            existing.ResourceItemId = resource.ResourceItemId;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{shelterId}/resources/{resourceId}")]
        [Authorize]
        public async Task<IActionResult> DeleteShelterResource(string shelterId, string resourceId)
        {
            var resource = await _context.ShelterResources.FindAsync(resourceId);
            if (resource == null || resource.ShelterId != shelterId) return NotFound();

            _context.ShelterResources.Remove(resource);
            await _context.SaveChangesAsync();
            await LogAuditAsync("Remove Shelter Resource", $"Removed resource {resource.ResourceType} from shelter {shelterId}");
            return NoContent();
        }

        // ---------- Shelter Reports ----------
        [HttpGet("{shelterId}/reports")]
        public async Task<ActionResult<IEnumerable<ShelterReport>>> GetShelterReports(string shelterId)
        {
            if (!ShelterExists(shelterId)) return NotFound();
            return await _context.ShelterReports
                .Where(r => r.ShelterId == shelterId)
                .OrderByDescending(r => r.GeneratedAt)
                .ToListAsync();
        }

        [HttpPost("{shelterId}/reports")]
        [Authorize]
        public async Task<ActionResult<ShelterReport>> GenerateShelterReport(string shelterId)
        {
            var shelter = await _context.Shelters.FindAsync(shelterId);
            if (shelter == null) return NotFound();

            var resources = await _context.ShelterResources
                .Where(r => r.ShelterId == shelterId)
                .ToListAsync();
            var resourceSummary = resources.Count == 0
                ? "No resources recorded"
                : string.Join("; ", resources.Select(r => $"{r.ResourceType}: {r.Quantity}"));

            var report = new ShelterReport
            {
                ShelterReportId = await GenerateNextShelterReportIdAsync(),
                ShelterId = shelterId,
                Name = shelter.ShelterName,
                Location = shelter.Address,
                TotalCapacity = shelter.TotalCapacity,
                AvailableCapacity = shelter.AvailableCapacity,
                Status = shelter.Status,
                ResourceSummary = resourceSummary,
                GeneratedAt = DateTime.UtcNow
            };

            _context.ShelterReports.Add(report);
            await _context.SaveChangesAsync();
            await LogAuditAsync("Generate Shelter Report", $"Generated report for {shelter.ShelterName}");

            return CreatedAtAction(nameof(GetShelterReports), new { shelterId }, report);
        }

        // ---------- Helpers ----------
        private bool ShelterExists(string shelterId)
        {
            return _context.Shelters.Any(e => e.ShelterId == shelterId);
        }

        private static async Task<string> GenerateNextShelterIdAsync(ApplicationDbContext context)
        {
            var last = await context.Shelters.OrderByDescending(s => s.ShelterId).FirstOrDefaultAsync();
            int next = 1;
            if (last != null && last.ShelterId.StartsWith("SHEL", StringComparison.OrdinalIgnoreCase))
            {
                // Extract number part: "SHEL001" -> "001"
                string numberPart = last.ShelterId.Length >= 7 ? last.ShelterId.Substring(4) : "000";
                // Handle cases where ID might be "SHELTER001" (old format) by taking only last 3 digits if possible, or just resetting if format is mixed
                if (last.ShelterId.StartsWith("SHELTER", StringComparison.OrdinalIgnoreCase))
                {
                     if (int.TryParse(last.ShelterId.Substring(7), out int n)) next = n + 1;
                }
                else if (int.TryParse(numberPart, out int n))
                {
                    next = n + 1;
                }
            }
            return $"SHEL{next:D3}";
        }

        private async Task<string> GenerateNextShelterIdAsync()
        {
            return await GenerateNextShelterIdAsync(_context);
        }

        private static async Task<string> GenerateNextEvacueeIdAsync(ApplicationDbContext context)
        {
            var last = await context.Evacuees.OrderByDescending(e => e.EvacueeId).FirstOrDefaultAsync();
            int next = 1;
            if (last != null && last.EvacueeId.StartsWith("EV", StringComparison.OrdinalIgnoreCase))
            {
                if (int.TryParse(last.EvacueeId.Length >= 2 ? last.EvacueeId.Substring(2) : null, out int n))
                    next = n + 1;
            }
            return $"EV{next:D3}";
        }

        private async Task<string> GenerateNextEvacueeIdAsync()
        {
            return await GenerateNextEvacueeIdAsync(_context);
        }

        private static async Task<string> GenerateNextShelterResourceIdAsync(ApplicationDbContext context)
        {
            var last = await context.ShelterResources.OrderByDescending(r => r.ShelterResourceId).FirstOrDefaultAsync();
            int next = 1;
            if (last != null && last.ShelterResourceId.StartsWith("SR", StringComparison.OrdinalIgnoreCase))
            {
                if (int.TryParse(last.ShelterResourceId.Length >= 2 ? last.ShelterResourceId.Substring(2) : null, out int n))
                    next = n + 1;
            }
            return $"SR{next:D3}";
        }

        private async Task<string> GenerateNextShelterResourceIdAsync()
        {
            return await GenerateNextShelterResourceIdAsync(_context);
        }

        private static async Task<string> GenerateNextShelterReportIdAsync(ApplicationDbContext context)
        {
            var last = await context.ShelterReports.OrderByDescending(r => r.ShelterReportId).FirstOrDefaultAsync();
            int next = 1;
            if (last != null && last.ShelterReportId.StartsWith("SHR", StringComparison.OrdinalIgnoreCase))
            {
                if (int.TryParse(last.ShelterReportId.Length >= 3 ? last.ShelterReportId.Substring(3) : null, out int n))
                    next = n + 1;
            }
            return $"SHR{next:D3}";
        }

        private async Task<string> GenerateNextShelterReportIdAsync()
        {
            return await GenerateNextShelterReportIdAsync(_context);
        }

        private static async Task<string> GenerateNextRequestIdAsync(ApplicationDbContext context)
        {
            var last = await context.ShelterRegistrationRequests.OrderByDescending(r => r.RequestId).FirstOrDefaultAsync();
            int next = 1;
            if (last != null && last.RequestId.StartsWith("SRR", StringComparison.OrdinalIgnoreCase))
            {
                if (int.TryParse(last.RequestId.Length >= 3 ? last.RequestId.Substring(3) : null, out int n))
                    next = n + 1;
            }
            return $"SRR{next:D3}";
        }

        private async Task<string> GenerateNextRequestIdAsync()
        {
            return await GenerateNextRequestIdAsync(_context);
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
                Module = "Shelter Management",
                Details = details,
                Timestamp = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();
        }
    }
}
