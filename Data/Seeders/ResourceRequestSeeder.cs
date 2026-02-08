using FYP_Project_II.Models;
using Microsoft.EntityFrameworkCore;

namespace FYP_Project_II.Data.Seeders
{
    public static class ResourceRequestSeeder
    {
        public static async Task SeedResourceRequestsAsync(ApplicationDbContext dbContext)
        {
            var baseDate = new DateTime(2024, 1, 15, 8, 0, 0, DateTimeKind.Utc);

            if (!dbContext.ResourceRequests.Any())
            {
                var resources = await dbContext.Resources.ToListAsync();
                if (resources.Count == 0) return;

                var res001 = resources.FirstOrDefault(r => r.ResourceItemId == "RES001");
                var res002 = resources.FirstOrDefault(r => r.ResourceItemId == "RES002");
                var res003 = resources.FirstOrDefault(r => r.ResourceItemId == "RES003");
                if (res001 == null || res002 == null || res003 == null) return;

                var requests = new[]
                {
                    new ResourceRequest
                    {
                        ResourceRequestId = "REQ001",
                        ResourceItemId = res001.ResourceItemId,
                        WarehouseId = res001.WarehouseId,
                        RequestedBy = "admin001",
                        ItemName = res001.Name,
                        Type = res001.Type,
                        Quantity = 50,
                        Unit = res001.Unit,
                        Destination = "Dewan Serbaguna Ampang",
                        Urgency = "High",
                        Status = "Pending",
                        RequestedAt = baseDate.AddHours(2),
                        UpdatedAt = baseDate.AddHours(2)
                    },
                    new ResourceRequest
                    {
                        ResourceRequestId = "REQ002",
                        ResourceItemId = res002.ResourceItemId,
                        WarehouseId = res002.WarehouseId,
                        RequestedBy = "shelter001",
                        ItemName = res002.Name,
                        Type = res002.Type,
                        Quantity = 100,
                        Unit = res002.Unit,
                        Destination = "SK Bukit Indah",
                        Urgency = "Critical",
                        Status = "Approved",
                        AssignedDriverId = "DRV001",
                        ProcessedBy = "resource001",
                        RequestedAt = baseDate.AddHours(1),
                        ProcessedAt = baseDate.AddHours(3),
                        UpdatedAt = baseDate.AddHours(3)
                    },
                    new ResourceRequest
                    {
                        ResourceRequestId = "REQ003",
                        ResourceItemId = res003.ResourceItemId,
                        WarehouseId = res003.WarehouseId,
                        RequestedBy = "responder001",
                        ItemName = res003.Name,
                        Type = res003.Type,
                        Quantity = 20,
                        Unit = res003.Unit,
                        Destination = "Medical Evacuation Center",
                        Urgency = "Medium",
                        Status = "Delivered",
                        AssignedDriverId = "DRV002",
                        ProcessedBy = "resource002",
                        RequestedAt = baseDate,
                        ProcessedAt = baseDate.AddHours(4),
                        UpdatedAt = baseDate.AddHours(5)
                    },
                    new ResourceRequest
                    {
                        ResourceRequestId = "REQ004",
                        ResourceItemId = res001.ResourceItemId,
                        WarehouseId = res001.WarehouseId,
                        RequestedBy = "shelter001",
                        ItemName = res001.Name,
                        Type = res001.Type,
                        Quantity = 500,
                        Unit = res001.Unit,
                        Destination = "Dewan Serbaguna Ampang",
                        Urgency = "Low",
                        Status = "Rejected",
                        RejectionReason = "Insufficient stock. Maximum 200 units available.",
                        ProcessedBy = "resource001",
                        RequestedAt = baseDate.AddHours(5),
                        ProcessedAt = baseDate.AddHours(6),
                        UpdatedAt = baseDate.AddHours(6)
                    }
                };

                var additionalRequests = new[]
                {
                    new ResourceRequest
                    {
                        ResourceRequestId = "REQ005",
                        ResourceItemId = res002.ResourceItemId,
                        WarehouseId = res002.WarehouseId,
                        RequestedBy = "shelter001",
                        ItemName = res002.Name,
                        Type = res002.Type,
                        Quantity = 30,
                        Unit = res002.Unit,
                        Destination = "SK Bukit Indah",
                        Urgency = "High",
                        Status = "Pending",
                        RequestedAt = baseDate.AddHours(10),
                        UpdatedAt = baseDate.AddHours(10)
                    },
                    new ResourceRequest
                    {
                        ResourceRequestId = "REQ006",
                        ResourceItemId = res003.ResourceItemId,
                        WarehouseId = res003.WarehouseId,
                        RequestedBy = "responder001",
                        ItemName = res003.Name,
                        Type = res003.Type,
                        Quantity = 15,
                        Unit = res003.Unit,
                        Destination = "Field Hospital A",
                        Urgency = "Medium",
                        Status = "Approved",
                        AssignedDriverId = "DRV003",
                        ProcessedBy = "resource002",
                        RequestedAt = baseDate.AddHours(12),
                        ProcessedAt = baseDate.AddHours(13),
                        UpdatedAt = baseDate.AddHours(13)
                    },
                    new ResourceRequest
                    {
                        ResourceRequestId = "REQ007",
                        ResourceItemId = res001.ResourceItemId,
                        WarehouseId = res001.WarehouseId,
                        RequestedBy = "admin001",
                        ItemName = res001.Name,
                        Type = res001.Type,
                        Quantity = 200,
                        Unit = res001.Unit,
                        Destination = "Main Distribution Center",
                        Urgency = "Low",
                        Status = "Delivered",
                        AssignedDriverId = "DRV001",
                        ProcessedBy = "resource001",
                        RequestedAt = baseDate.AddDays(1),
                        ProcessedAt = baseDate.AddDays(1).AddHours(2),
                        UpdatedAt = baseDate.AddDays(1).AddHours(4)
                    },
                    new ResourceRequest
                    {
                        ResourceRequestId = "REQ008",
                        ResourceItemId = res002.ResourceItemId,
                        WarehouseId = res002.WarehouseId,
                        RequestedBy = "shelter002",
                        ItemName = res002.Name,
                        Type = res002.Type,
                        Quantity = 80,
                        Unit = res002.Unit,
                        Destination = "Community Hall B",
                        Urgency = "Critical",
                        Status = "Pending",
                        RequestedAt = baseDate.AddDays(1).AddHours(5),
                        UpdatedAt = baseDate.AddDays(1).AddHours(5)
                    },
                    new ResourceRequest
                    {
                        ResourceRequestId = "REQ009",
                        ResourceItemId = res003.ResourceItemId,
                        WarehouseId = res003.WarehouseId,
                        RequestedBy = "responder002",
                        ItemName = res003.Name,
                        Type = res003.Type,
                        Quantity = 5,
                        Unit = res003.Unit,
                        Destination = "Mobile Clinic 1",
                        Urgency = "Medium",
                        Status = "Rejected",
                        RejectionReason = "Duplicate request found.",
                        ProcessedBy = "resource001",
                        RequestedAt = baseDate.AddDays(1).AddHours(6),
                        ProcessedAt = baseDate.AddDays(1).AddHours(7),
                        UpdatedAt = baseDate.AddDays(1).AddHours(7)
                    },
                    new ResourceRequest
                    {
                        ResourceRequestId = "REQ010",
                        ResourceItemId = res001.ResourceItemId,
                        WarehouseId = res001.WarehouseId,
                        RequestedBy = "shelter001",
                        ItemName = res001.Name,
                        Type = res001.Type,
                        Quantity = 1000,
                        Unit = res001.Unit,
                        Destination = "SK Bukit Indah",
                        Urgency = "High",
                        Status = "Delivered",
                        AssignedDriverId = "DRV002",
                        ProcessedBy = "resource002",
                        RequestedAt = baseDate.AddDays(2),
                        ProcessedAt = baseDate.AddDays(2).AddHours(1),
                        UpdatedAt = baseDate.AddDays(2).AddHours(5)
                    }
                };

                var allRequests = requests.Concat(additionalRequests).ToArray();
                await dbContext.ResourceRequests.AddRangeAsync(allRequests);
                Console.WriteLine("Seeded Resource Requests");
            }
        }
    }
}
