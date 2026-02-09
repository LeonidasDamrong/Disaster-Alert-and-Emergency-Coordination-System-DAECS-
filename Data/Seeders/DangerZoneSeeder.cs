using FYP_Project_II.Models;

namespace FYP_Project_II.Data.Seeders
{
    public static class DangerZoneSeeder
    {
        public static async Task SeedDangerZonesAsync(ApplicationDbContext dbContext)
        {
            if (dbContext.DangerZones.Any()) return;

            var baseDate = DateTime.UtcNow;
            var zones = new[]
            {
                new DangerZone
                {
                    DangerZoneId = "DZ001",
                    Name = "Flood Zone - Taman Sri Muda",
                    Description = "High flood risk area during monsoon",
                    CenterLatitude = 3.0567m,
                    CenterLongitude = 101.5335m,
                    RadiusMeters = 2000,
                    DangerLevel = "High",
                    ColorHex = "#DC2626",
                    IsActive = true,
                    CreatedAt = baseDate,
                    UpdatedAt = baseDate
                },
                new DangerZone
                {
                    DangerZoneId = "DZ002",
                    Name = "Landslide Risk - Ulu Klang",
                    Description = "Landslide prone area",
                    CenterLatitude = 3.1650m,
                    CenterLongitude = 101.7520m,
                    RadiusMeters = 1500,
                    DangerLevel = "Critical",
                    ColorHex = "#B91C1C",
                    IsActive = true,
                    CreatedAt = baseDate,
                    UpdatedAt = baseDate
                },
                new DangerZone
                {
                    DangerZoneId = "DZ003",
                    Name = "Evacuation Zone - Kampung Baru",
                    Description = "Designated evacuation area",
                    CenterLatitude = 3.1642m,
                    CenterLongitude = 101.7041m,
                    RadiusMeters = 1000,
                    DangerLevel = "Medium",
                    ColorHex = "#F59E0B",
                    IsActive = true,
                    CreatedAt = baseDate,
                    UpdatedAt = baseDate
                }
            };

            await dbContext.DangerZones.AddRangeAsync(zones);
            Console.WriteLine("Seeded Danger Zones");
        }
    }
}
