using FYP_Project_II.Models;

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
        }
    }
}
