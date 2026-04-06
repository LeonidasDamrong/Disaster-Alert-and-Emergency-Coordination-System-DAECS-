using FYP_Project_II.Models;
using Microsoft.EntityFrameworkCore;

namespace FYP_Project_II.Data.Seeders
{
    public static class DriverSeeder
    {
        public static async Task SeedDriversAsync(ApplicationDbContext dbContext)
        {
            var baseDate = new DateTime(2024, 1, 15, 8, 0, 0, DateTimeKind.Utc);

            if (!dbContext.Drivers.Any())
            {
                var drivers = new[]
                {
                    new Driver { DriverId = "DRV001", Name = "Team Alpha", Phone = "+60111111111", VehicleInfo = "Truck A - Registration ABC1234", Status = "Available", CreatedAt = baseDate, UpdatedAt = baseDate },
                    new Driver { DriverId = "DRV002", Name = "Team Bravo", Phone = "+60122222222", VehicleInfo = "Van B - Registration DEF5678", Status = "Available", CreatedAt = baseDate, UpdatedAt = baseDate },
                    new Driver { DriverId = "DRV003", Name = "Team Charlie", Phone = "+60133333333", VehicleInfo = "Truck C - Registration GHI9012", Status = "Available", CreatedAt = baseDate, UpdatedAt = baseDate }
                };
                await dbContext.Drivers.AddRangeAsync(drivers);
                Console.WriteLine("Seeded Drivers");
            }

            // Keep driver availability connected to existing requests:
            // any driver assigned to an Approved (in-progress) request becomes Busy.
            var busyDriverIds = await dbContext.ResourceRequests
                .Where(r => r.Status == "Approved" && r.AssignedDriverId != null && r.AssignedDriverId != "")
                .Select(r => r.AssignedDriverId!)
                .Distinct()
                .ToListAsync();

            var driversToUpdate = await dbContext.Drivers.ToListAsync();
            var now = DateTime.UtcNow;
            var updated = false;
            foreach (var d in driversToUpdate)
            {
                var next = busyDriverIds.Contains(d.DriverId) ? "Busy" : "Available";
                if (!string.Equals(d.Status, next, StringComparison.OrdinalIgnoreCase))
                {
                    d.Status = next;
                    d.UpdatedAt = now;
                    updated = true;
                }
            }

            if (updated)
            {
                await dbContext.SaveChangesAsync();
                Console.WriteLine("Updated driver availability from resource requests");
            }
        }
    }
}
