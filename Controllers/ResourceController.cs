using FYP_Project_II.Data;
using FYP_Project_II.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FYP_Project_II.Controllers
{
    [Route("api/resources")]
    [ApiController]
    public class ResourceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public ResourceController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        private string? GetCurrentUserName() => User.FindFirst(ClaimTypes.Name)?.Value ?? User.Identity?.Name;

        // ========== Warehouses (Admin assigns Resource Manager) ==========
        [HttpGet("warehouses")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<Warehouse>>> GetWarehouses()
        {
            return await _context.Warehouses.OrderBy(w => w.Name).ToListAsync();
        }

        [HttpGet("warehouses/my-warehouse")]
        [Authorize(Roles = "Resource Manager")]
        public async Task<ActionResult<Warehouse>> GetMyWarehouse()
        {
            var userName = GetCurrentUserName();
            if (string.IsNullOrEmpty(userName)) return Unauthorized();

            var wh = await _context.Warehouses.FirstOrDefaultAsync(w => w.ManagedBy == userName);
            if (wh == null) return NotFound();
            return wh;
        }

        [HttpGet("warehouses/{warehouseId}")]
        [Authorize]
        public async Task<ActionResult<Warehouse>> GetWarehouse(string warehouseId)
        {
            var wh = await _context.Warehouses.FindAsync(warehouseId);
            if (wh == null) return NotFound();
            return wh;
        }

        [HttpPut("warehouses/{warehouseId}")]
        [Authorize(Roles = "Admin, System Admin")]
        public async Task<IActionResult> UpdateWarehouse(string warehouseId, [FromBody] UpdateWarehouseDto dto)
        {
            var wh = await _context.Warehouses.FindAsync(warehouseId);
            if (wh == null) return NotFound();

            if (!string.IsNullOrEmpty(dto.Name)) wh.Name = dto.Name;
            if (!string.IsNullOrEmpty(dto.Address)) wh.Address = dto.Address;
            if (dto.ManagedBy != null)
            {
                if (dto.ManagedBy == "none" || string.IsNullOrWhiteSpace(dto.ManagedBy))
                    wh.ManagedBy = null;
                else
                {
                    var user = await _userManager.FindByNameAsync(dto.ManagedBy);
                    if (user == null) return BadRequest(new { message = "Resource manager not found." });
                    var roles = await _userManager.GetRolesAsync(user);
                    if (!roles.Contains("Resource Manager"))
                        return BadRequest(new { message = "User is not a Resource Manager." });
                    var alreadyAssigned = await _context.Warehouses.AnyAsync(w => w.ManagedBy == dto.ManagedBy && w.WarehouseId != warehouseId);
                    if (alreadyAssigned)
                        return BadRequest(new { message = "This resource manager is already assigned to another warehouse." });
                    wh.ManagedBy = dto.ManagedBy;
                }
            }
            wh.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            await LogAuditAsync("Update Warehouse", $"Updated warehouse {warehouseId}");
            return Ok(wh);
        }

        // ========== Resources - View (Admin: view all; Resource Manager: only their warehouse) ==========
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<object>>> GetResources([FromQuery] string? warehouseId, [FromQuery] string? status)
        {
            var query = _context.Resources.AsQueryable();

            if (User.IsInRole("Resource Manager"))
            {
                var userName = GetCurrentUserName();
                var myWarehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.ManagedBy == userName);
                if (myWarehouse == null)
                    return Ok(Array.Empty<object>());
                query = query.Where(r => r.WarehouseId == myWarehouse.WarehouseId);
            }
            else if (!string.IsNullOrEmpty(warehouseId))
            {
                query = query.Where(r => r.WarehouseId == warehouseId);
            }

            if (!string.IsNullOrEmpty(status))
                query = query.Where(r => r.Status == status);

            var items = await query
                .OrderBy(r => r.WarehouseId)
                .ThenBy(r => r.Type)
                .ThenBy(r => r.Name)
                .ToListAsync();

            var warehouses = await _context.Warehouses.ToDictionaryAsync(w => w.WarehouseId, w => w.Name);
            return Ok(items.Select(r => new
            {
                r.ResourceItemId,
                r.WarehouseId,
                WarehouseName = warehouses.GetValueOrDefault(r.WarehouseId, ""),
                r.Name,
                r.Type,
                r.Unit,
                r.Quantity,
                r.Status,
                r.CreatedAt,
                r.UpdatedAt
            }));
        }

        [HttpGet("overall-quantity")]
        [Authorize(Roles = "Admin, System Admin")]
        public async Task<ActionResult<object>> GetOverallQuantity()
        {
            var byWarehouse = await _context.Resources
                .GroupBy(r => new { r.WarehouseId, r.Name, r.Type, r.Unit })
                .Select(g => new
                {
                    g.Key.WarehouseId,
                    g.Key.Name,
                    g.Key.Type,
                    g.Key.Unit,
                    TotalQuantity = g.Sum(r => r.Quantity)
                })
                .ToListAsync();

            var warehouses = await _context.Warehouses.ToDictionaryAsync(w => w.WarehouseId, w => w.Name);
            var totalByItem = byWarehouse.GroupBy(x => new { x.Name, x.Type, x.Unit })
                .Select(g => new
                {
                    g.Key.Name,
                    g.Key.Type,
                    g.Key.Unit,
                    TotalQuantity = g.Sum(x => x.TotalQuantity),
                    ByWarehouse = g.Select(x => new { WarehouseId = x.WarehouseId, WarehouseName = warehouses.GetValueOrDefault(x.WarehouseId, ""), x.TotalQuantity })
                });

            return Ok(new { byItem = totalByItem, byWarehouse });
        }

        [HttpGet("{resourceItemId}")]
        [Authorize]
        public async Task<ActionResult<object>> GetResource(string resourceItemId)
        {
            var r = await _context.Resources.FindAsync(resourceItemId);
            if (r == null) return NotFound();
            var wh = await _context.Warehouses.FindAsync(r.WarehouseId);
            return Ok(new
            {
                r.ResourceItemId,
                r.WarehouseId,
                WarehouseName = wh?.Name ?? "",
                r.Name,
                r.Type,
                r.Unit,
                r.Quantity,
                r.Status,
                r.CreatedAt,
                r.UpdatedAt
            });
        }

        [HttpPost]
        [Authorize(Roles = "Resource Manager")]
        public async Task<ActionResult<ResourceItem>> CreateResource([FromBody] CreateResourceDto dto)
        {
            var userName = GetCurrentUserName();
            var myWarehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.ManagedBy == userName);
            if (myWarehouse == null)
                return BadRequest(new { message = "You are not assigned to any warehouse." });
            if (dto.WarehouseId != myWarehouse.WarehouseId)
                return BadRequest(new { message = "You can only add resources to your assigned warehouse." });

            var resource = new ResourceItem
            {
                ResourceItemId = await GenerateNextResourceIdAsync(),
                WarehouseId = dto.WarehouseId,
                Name = dto.Name,
                Type = dto.Type,
                Unit = dto.Unit ?? "units",
                Quantity = dto.Quantity,
                Status = dto.Status ?? "Available",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Resources.Add(resource);
            await _context.SaveChangesAsync();
            await LogAuditAsync("Create Resource", $"Created resource {resource.ResourceItemId}: {resource.Name}");
            return CreatedAtAction(nameof(GetResource), new { resourceItemId = resource.ResourceItemId }, resource);
        }

        [HttpPut("{resourceItemId}")]
        [Authorize(Roles = "Resource Manager")]
        public async Task<IActionResult> UpdateResource(string resourceItemId, [FromBody] UpdateResourceDto dto)
        {
            var r = await _context.Resources.FindAsync(resourceItemId);
            if (r == null) return NotFound();

            var userName = GetCurrentUserName();
            var myWarehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.ManagedBy == userName);
            if (myWarehouse == null || r.WarehouseId != myWarehouse.WarehouseId)
                return Forbid();

            if (!string.IsNullOrEmpty(dto.Name)) r.Name = dto.Name;
            if (!string.IsNullOrEmpty(dto.Type)) r.Type = dto.Type;
            if (!string.IsNullOrEmpty(dto.Unit)) r.Unit = dto.Unit;
            if (dto.Quantity.HasValue) r.Quantity = dto.Quantity.Value;
            if (!string.IsNullOrEmpty(dto.Status)) r.Status = dto.Status;
            if (!string.IsNullOrEmpty(dto.WarehouseId)) r.WarehouseId = dto.WarehouseId;
            r.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await LogAuditAsync("Update Resource", $"Updated resource {resourceItemId}");
            return NoContent();
        }

        [HttpDelete("{resourceItemId}")]
        [Authorize(Roles = "Resource Manager")]
        public async Task<IActionResult> DeleteResource(string resourceItemId)
        {
            var r = await _context.Resources.FindAsync(resourceItemId);
            if (r == null) return NotFound();

            var userName = GetCurrentUserName();
            var myWarehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.ManagedBy == userName);
            if (myWarehouse == null || r.WarehouseId != myWarehouse.WarehouseId)
                return Forbid();

            var hasRequests = await _context.ResourceRequests.AnyAsync(req => req.ResourceItemId == resourceItemId);
            if (hasRequests)
                return BadRequest(new { message = "Cannot delete resource with existing requests." });

            _context.Resources.Remove(r);
            await _context.SaveChangesAsync();
            await LogAuditAsync("Delete Resource", $"Deleted resource {resourceItemId}");
            return NoContent();
        }

        [HttpPost("{resourceItemId}/stock-in")]
        [Authorize(Roles = "Resource Manager")]
        public async Task<IActionResult> StockIn(string resourceItemId, [FromBody] StockInDto dto)
        {
            var r = await _context.Resources.FindAsync(resourceItemId);
            if (r == null) return NotFound();

            var userName = GetCurrentUserName();
            var myWarehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.ManagedBy == userName);
            if (myWarehouse == null || r.WarehouseId != myWarehouse.WarehouseId)
                return Forbid();
            if (dto.QuantityAdded <= 0)
                return BadRequest(new { message = "Quantity must be positive." });
            if (string.IsNullOrWhiteSpace(dto.Source))
                return BadRequest(new { message = "Source of stock is required." });

            r.Quantity += dto.QuantityAdded;
            r.UpdatedAt = DateTime.UtcNow;

            var log = new ResourceStockLog
            {
                ResourceStockLogId = await GenerateNextStockLogIdAsync(),
                ResourceItemId = resourceItemId,
                WarehouseId = r.WarehouseId,
                QuantityAdded = dto.QuantityAdded,
                Source = dto.Source,
                LoggedBy = GetCurrentUserName() ?? "System",
                LoggedAt = DateTime.UtcNow
            };
            _context.ResourceStockLogs.Add(log);
            await _context.SaveChangesAsync();
            await LogAuditAsync("Stock In", $"Added {dto.QuantityAdded} to {resourceItemId}, source: {dto.Source}");
            return Ok(new { resource = r, log });
        }

        [HttpGet("{resourceItemId}/stock-logs")]
        [Authorize(Roles = "Resource Manager, Admin, System Admin")]
        public async Task<ActionResult<IEnumerable<ResourceStockLog>>> GetStockLogs(string resourceItemId)
        {
            return await _context.ResourceStockLogs
                .Where(l => l.ResourceItemId == resourceItemId)
                .OrderByDescending(l => l.LoggedAt)
                .ToListAsync();
        }

        // ========== Resource Requests (All users can request) ==========
        [HttpGet("requests")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<object>>> GetResourceRequests([FromQuery] string? status, [FromQuery] bool myOnly = false)
        {
            var userName = GetCurrentUserName();
            if (string.IsNullOrEmpty(userName)) return Unauthorized();

            var query = _context.ResourceRequests.AsQueryable();

            if (User.IsInRole("Resource Manager"))
            {
                var myWarehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.ManagedBy == userName);
                if (myWarehouse != null)
                    query = query.Where(r => r.WarehouseId == myWarehouse.WarehouseId);
                else
                    query = query.Where(r => false);
            }
            else if (myOnly)
                query = query.Where(r => r.RequestedBy == userName);

            if (!string.IsNullOrEmpty(status))
                query = query.Where(r => r.Status == status);

            var isAdmin = User.IsInRole("Admin") || User.IsInRole("System Admin");
            if (isAdmin)
                query = query.Where(r => r.Status != "Pending"); // Admin views all except Pending

            var list = await query.OrderByDescending(r => r.RequestedAt).ToListAsync();
            var resources = await _context.Resources.ToDictionaryAsync(r => r.ResourceItemId, r => r);
            var warehouses = await _context.Warehouses.ToDictionaryAsync(w => w.WarehouseId, w => w.Name);
            var drivers = await _context.Drivers.ToDictionaryAsync(d => d.DriverId, d => d.Name);

            return Ok(list.Select(r => new
            {
                r.ResourceRequestId,
                r.ResourceItemId,
                r.WarehouseId,
                WarehouseName = warehouses.GetValueOrDefault(r.WarehouseId, ""),
                r.RequestedBy,
                r.ItemName,
                r.Type,
                r.Quantity,
                r.Unit,
                r.Destination,
                r.Urgency,
                r.Status,
                r.RejectionReason,
                r.AssignedDriverId,
                DriverName = r.AssignedDriverId != null ? drivers.GetValueOrDefault(r.AssignedDriverId, "") : null,
                r.ProcessedBy,
                r.RequestedAt,
                r.ProcessedAt,
                r.UpdatedAt
            }));
        }

        [HttpPost("requests")]
        [Authorize]
        public async Task<ActionResult<ResourceRequest>> CreateResourceRequest([FromBody] CreateResourceRequestDto dto)
        {
            var resource = await _context.Resources.FindAsync(dto.ResourceItemId);
            if (resource == null) return BadRequest(new { message = "Resource item not found." });

            var request = new ResourceRequest
            {
                ResourceRequestId = await GenerateNextResourceRequestIdAsync(),
                ResourceItemId = dto.ResourceItemId,
                WarehouseId = resource.WarehouseId,
                RequestedBy = GetCurrentUserName() ?? "Unknown",
                ItemName = resource.Name,
                Type = resource.Type,
                Quantity = dto.Quantity,
                Unit = resource.Unit,
                Destination = dto.Destination ?? "",
                Urgency = dto.Urgency ?? "Medium",
                Status = "Pending",
                RequestedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.ResourceRequests.Add(request);
            await _context.SaveChangesAsync();
            await LogAuditAsync("Resource Request", $"Requested {dto.Quantity} {resource.Name} by {request.RequestedBy}");
            return CreatedAtAction(nameof(GetResourceRequests), new { }, request);
        }

        [HttpPost("requests/{requestId}/approve")]
        [Authorize(Roles = "Resource Manager")]
        public async Task<IActionResult> ApproveResourceRequest(string requestId)
        {
            var req = await _context.ResourceRequests.FindAsync(requestId);
            if (req == null) return NotFound();

            var userName = GetCurrentUserName();
            var myWarehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.ManagedBy == userName);
            if (myWarehouse == null || req.WarehouseId != myWarehouse.WarehouseId)
                return Forbid();
            if (req.Status != "Pending")
                return BadRequest(new { message = "Request has already been processed." });

            var resource = await _context.Resources.FindAsync(req.ResourceItemId);
            if (resource == null) return BadRequest(new { message = "Resource no longer exists." });
            if (resource.Quantity < req.Quantity)
                return BadRequest(new { message = "Insufficient stock." });

            resource.Quantity -= req.Quantity; // Deduct inventory on approval
            resource.UpdatedAt = DateTime.UtcNow;

            req.Status = "Approved";
            req.ProcessedAt = DateTime.UtcNow;
            req.ProcessedBy = GetCurrentUserName();
            req.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            await LogAuditAsync("Approve Resource Request", $"Approved request {requestId}");
            return Ok(req);
        }

        [HttpPost("requests/{requestId}/reject")]
        [Authorize(Roles = "Resource Manager")]
        public async Task<IActionResult> RejectResourceRequest(string requestId, [FromBody] RejectResourceRequestDto dto)
        {
            var req = await _context.ResourceRequests.FindAsync(requestId);
            if (req == null) return NotFound();

            var userName = GetCurrentUserName();
            var myWarehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.ManagedBy == userName);
            if (myWarehouse == null || req.WarehouseId != myWarehouse.WarehouseId)
                return Forbid();
            if (req.Status != "Pending")
                return BadRequest(new { message = "Request has already been processed." });

            if (string.IsNullOrWhiteSpace(dto.RejectionReason))
                return BadRequest(new { message = "Rejection reason is required." });

            req.Status = "Rejected";
            req.RejectionReason = dto.RejectionReason;
            req.ProcessedAt = DateTime.UtcNow;
            req.ProcessedBy = GetCurrentUserName();
            req.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            await LogAuditAsync("Reject Resource Request", $"Rejected request {requestId}: {dto.RejectionReason}");
            return Ok(req);
        }

        [HttpPost("requests/{requestId}/assign-driver")]
        [Authorize(Roles = "Resource Manager")]
        public async Task<IActionResult> AssignDriver(string requestId, [FromBody] AssignDriverDto dto)
        {
            var req = await _context.ResourceRequests.FindAsync(requestId);
            if (req == null) return NotFound();

            var userName = GetCurrentUserName();
            var myWarehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.ManagedBy == userName);
            if (myWarehouse == null || req.WarehouseId != myWarehouse.WarehouseId)
                return Forbid();
            if (req.Status != "Approved")
                return BadRequest(new { message = "Only approved requests can have a driver assigned." });

            var driver = await _context.Drivers.FindAsync(dto.DriverId);
            if (driver == null) return BadRequest(new { message = "Driver not found." });

            req.AssignedDriverId = dto.DriverId;
            req.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            await LogAuditAsync("Assign Driver", $"Assigned driver {dto.DriverId} to request {requestId}");
            return Ok(req);
        }

        [HttpPost("requests/{requestId}/mark-delivered")]
        [Authorize(Roles = "Resource Manager")]
        public async Task<IActionResult> MarkDelivered(string requestId)
        {
            var req = await _context.ResourceRequests.FindAsync(requestId);
            if (req == null) return NotFound();

            var userName = GetCurrentUserName();
            var myWarehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.ManagedBy == userName);
            if (myWarehouse == null || req.WarehouseId != myWarehouse.WarehouseId)
                return Forbid();
            if (req.Status != "Approved")
                return BadRequest(new { message = "Only approved requests can be marked as delivered." });

            // Stock is already deducted on Approval. Do not deduct here.

            req.Status = "Delivered";
            req.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            await LogAuditAsync("Mark Delivered", $"Request {requestId} marked as delivered");
            return Ok(req);
        }

        // ========== Drivers ==========
        [HttpGet("drivers")]
        [Authorize(Roles = "Resource Manager, Admin, System Admin")]
        public async Task<ActionResult<IEnumerable<Driver>>> GetDrivers()
        {
            return await _context.Drivers.OrderBy(d => d.Name).ToListAsync();
        }

        // ========== Resource Usage Report ==========
        [HttpGet("usage-report")]
        [Authorize(Roles = "Admin, System Admin, Resource Manager")]
        public async Task<ActionResult<IEnumerable<ResourceUsageReport>>> GetResourceUsageReport()
        {
            var warehouses = await _context.Warehouses.ToDictionaryAsync(w => w.WarehouseId, w => w.Name);
            var query = _context.Resources.AsQueryable();

            if (User.IsInRole("Resource Manager"))
            {
                var userName = GetCurrentUserName();
                var myWarehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.ManagedBy == userName);
                if (myWarehouse != null)
                {
                    query = query.Where(r => r.WarehouseId == myWarehouse.WarehouseId);
                }
                else
                {
                    return Ok(Array.Empty<ResourceUsageReport>());
                }
            }

            var resources = await query.ToListAsync();
            var requests = await _context.ResourceRequests.ToListAsync();

            var report = resources.Select(r => new ResourceUsageReport
            {
                ReportId = $"RPT-{r.ResourceItemId}",
                WarehouseId = r.WarehouseId,
                WarehouseName = warehouses.GetValueOrDefault(r.WarehouseId, ""),
                ResourceItemId = r.ResourceItemId,
                ItemName = r.Name,
                Type = r.Type,
                Quantity = r.Quantity,
                Unit = r.Unit,
                Status = r.Status,
                RequestsCount = requests.Count(req => req.ResourceItemId == r.ResourceItemId),
                DeliveredCount = requests.Count(req => req.ResourceItemId == r.ResourceItemId && req.Status == "Delivered"),
                GeneratedAt = DateTime.UtcNow
            }).OrderBy(x => x.WarehouseName).ThenBy(x => x.Type).ThenBy(x => x.ItemName).ToList();

            return Ok(report);
        }

        // ========== Helpers ==========
        private async Task<string> GenerateNextResourceIdAsync()
        {
            var last = await _context.Resources.OrderByDescending(r => r.ResourceItemId).FirstOrDefaultAsync();
            int next = 1;
            if (last != null && last.ResourceItemId.StartsWith("RES", StringComparison.OrdinalIgnoreCase))
            {
                var suf = last.ResourceItemId.Length > 3 ? last.ResourceItemId[3..] : "";
                if (int.TryParse(suf, out int n)) next = n + 1;
            }
            return $"RES{next:D3}";
        }

        private async Task<string> GenerateNextResourceRequestIdAsync()
        {
            var last = await _context.ResourceRequests.OrderByDescending(r => r.ResourceRequestId).FirstOrDefaultAsync();
            int next = 1;
            if (last != null && last.ResourceRequestId.StartsWith("REQ", StringComparison.OrdinalIgnoreCase))
            {
                var suf = last.ResourceRequestId.Length > 3 ? last.ResourceRequestId[3..] : "";
                if (int.TryParse(suf, out int n)) next = n + 1;
            }
            return $"REQ{next:D3}";
        }

        private async Task<string> GenerateNextStockLogIdAsync()
        {
            var last = await _context.ResourceStockLogs.OrderByDescending(l => l.ResourceStockLogId).FirstOrDefaultAsync();
            int next = 1;
            if (last != null && last.ResourceStockLogId.StartsWith("RSL", StringComparison.OrdinalIgnoreCase))
            {
                var suf = last.ResourceStockLogId.Length > 3 ? last.ResourceStockLogId[3..] : "";
                if (int.TryParse(suf, out int n)) next = n + 1;
            }
            return $"RSL{next:D4}";
        }

        private async Task LogAuditAsync(string action, string details)
        {
            var user = await _userManager.GetUserAsync(User);
            _context.AuditLogs.Add(new AuditLog
            {
                Id = await AuditLog.GenerateNextIdAsync(_context),
                Username = user?.UserName ?? "Unknown",
                Name = user?.Name ?? "Unknown",
                Action = action,
                Module = "Resource Management",
                Details = details,
                Timestamp = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }
    }

    public class UpdateWarehouseDto { public string? Name { get; set; } public string? Address { get; set; } public string? ManagedBy { get; set; } }
    public class CreateResourceDto { public string WarehouseId { get; set; } = ""; public string Name { get; set; } = ""; public string Type { get; set; } = ""; public string? Unit { get; set; } public int Quantity { get; set; } public string? Status { get; set; } }
    public class UpdateResourceDto { public string? Name { get; set; } public string? Type { get; set; } public string? Unit { get; set; } public int? Quantity { get; set; } public string? Status { get; set; } public string? WarehouseId { get; set; } }
    public class StockInDto { public int QuantityAdded { get; set; } public string Source { get; set; } = ""; }
    public class CreateResourceRequestDto { public string ResourceItemId { get; set; } = ""; public int Quantity { get; set; } public string? Destination { get; set; } public string? Urgency { get; set; } }
    public class RejectResourceRequestDto { public string RejectionReason { get; set; } = ""; }
    public class AssignDriverDto { public string DriverId { get; set; } = ""; }
}
