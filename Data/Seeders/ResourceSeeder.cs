using FYP_Project_II.Models;
using Microsoft.EntityFrameworkCore;

namespace FYP_Project_II.Data.Seeders
{
    public static class ResourceSeeder
    {
        public static async Task SeedResourcesAsync(ApplicationDbContext dbContext)
        {
            var baseDate = new DateTime(2024, 1, 15, 8, 0, 0, DateTimeKind.Utc);

            if (!dbContext.Resources.Any())
            {
                var resources = new[]
                {
                    new ResourceItem { ResourceItemId = "RES001", WarehouseId = "WH001", Name = "Drinking Water", Type = "Water", Unit = "liters", Quantity = 800, Status = "Available", CreatedAt = baseDate, UpdatedAt = baseDate },
                    new ResourceItem { ResourceItemId = "RES002", WarehouseId = "WH001", Name = "Canned Food", Type = "Food", Unit = "cans", Quantity = 400, Status = "Available", CreatedAt = baseDate, UpdatedAt = baseDate },
                    new ResourceItem { ResourceItemId = "RES003", WarehouseId = "WH003", Name = "First Aid Kits", Type = "Medical", Unit = "units", Quantity = 15, Status = "Critical", CreatedAt = baseDate, UpdatedAt = baseDate },
                    new ResourceItem { ResourceItemId = "RES004", WarehouseId = "WH001", Name = "Blankets", Type = "Supplies", Unit = "pieces", Quantity = 200, Status = "Available", CreatedAt = baseDate, UpdatedAt = baseDate },
                    new ResourceItem { ResourceItemId = "RES005", WarehouseId = "WH002", Name = "Tents", Type = "Shelter", Unit = "units", Quantity = 20, Status = "Reserved", CreatedAt = baseDate, UpdatedAt = baseDate },
                    new ResourceItem { ResourceItemId = "RES006", WarehouseId = "WH001", Name = "Rice", Type = "Food", Unit = "kg", Quantity = 500, Status = "Available", CreatedAt = baseDate, UpdatedAt = baseDate }
                };
                await dbContext.Resources.AddRangeAsync(resources);
                Console.WriteLine("Seeded Resources");
            }
            else
            {
                // Fix existing resources that may have empty WarehouseId from migration
                var emptyWarehouse = await dbContext.Resources.Where(r => string.IsNullOrEmpty(r.WarehouseId)).ToListAsync();
                if (emptyWarehouse.Any())
                {
                    var firstWarehouse = await dbContext.Warehouses.FirstOrDefaultAsync();
                    if (firstWarehouse != null)
                    {
                        foreach (var r in emptyWarehouse)
                        {
                            r.WarehouseId = firstWarehouse.WarehouseId;
                            r.Unit = string.IsNullOrEmpty(r.Unit) ? "units" : r.Unit;
                        }
                        await dbContext.SaveChangesAsync();
                        Console.WriteLine($"Updated {emptyWarehouse.Count} resources with warehouse assignment");
                    }
                }
            }
        }
    }
}
