using FYP_Project_II.Models;

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
                    new ResourceItem { ResourceItemId = "RES001", Name = "Drinking Water", Type = "Water", Quantity = 1000, Status = "Available", CreatedAt = baseDate, UpdatedAt = baseDate },
                    new ResourceItem { ResourceItemId = "RES002", Name = "Canned Food", Type = "Food", Quantity = 500, Status = "Available", CreatedAt = baseDate, UpdatedAt = baseDate },
                    new ResourceItem { ResourceItemId = "RES003", Name = "First Aid Kits", Type = "Medical", Quantity = 50, Status = "Critical", CreatedAt = baseDate, UpdatedAt = baseDate },
                    new ResourceItem { ResourceItemId = "RES004", Name = "Blankets", Type = "Supplies", Quantity = 200, Status = "Available", CreatedAt = baseDate, UpdatedAt = baseDate },
                    new ResourceItem { ResourceItemId = "RES005", Name = "Tents", Type = "Shelter", Quantity = 20, Status = "Reserved", CreatedAt = baseDate, UpdatedAt = baseDate }
                };
                await dbContext.Resources.AddRangeAsync(resources);
                Console.WriteLine("Seeded Resources");
            }
        }
    }
}
