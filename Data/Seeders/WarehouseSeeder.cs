using FYP_Project_II.Models;
using Microsoft.EntityFrameworkCore;

namespace FYP_Project_II.Data.Seeders
{
    public static class WarehouseSeeder
    {
        public static async Task SeedWarehousesAsync(ApplicationDbContext dbContext)
        {
            var baseDate = new DateTime(2024, 1, 15, 8, 0, 0, DateTimeKind.Utc);

            if (!dbContext.Warehouses.Any())
            {
                var warehouses = new[]
                {
                    new Warehouse { WarehouseId = "WH001", Name = "Central Warehouse KL", Address = "Kuala Lumpur Central Logistics Hub", ManagedBy = "resource001", CreatedAt = baseDate, UpdatedAt = baseDate },
                    new Warehouse { WarehouseId = "WH002", Name = "Equipment Depot Selangor", Address = "Selangor Industrial Park", ManagedBy = "resource002", CreatedAt = baseDate, UpdatedAt = baseDate },
                    new Warehouse { WarehouseId = "WH003", Name = "Medical Supplies Depot", Address = "Petaling Jaya Medical Center", ManagedBy = null, CreatedAt = baseDate, UpdatedAt = baseDate }
                };
                await dbContext.Warehouses.AddRangeAsync(warehouses);
                Console.WriteLine("Seeded Warehouses");
            }
            else
            {
                var whList = await dbContext.Warehouses.ToListAsync();
                var updated = false;
                if (whList.Count >= 1 && string.IsNullOrEmpty(whList[0].ManagedBy)) { whList[0].ManagedBy = "resource001"; whList[0].UpdatedAt = DateTime.UtcNow; updated = true; }
                if (whList.Count >= 2 && string.IsNullOrEmpty(whList[1].ManagedBy)) { whList[1].ManagedBy = "resource002"; whList[1].UpdatedAt = DateTime.UtcNow; updated = true; }
                if (updated) { await dbContext.SaveChangesAsync(); Console.WriteLine("Updated warehouse ManagedBy"); }
            }
        }
    }
}
