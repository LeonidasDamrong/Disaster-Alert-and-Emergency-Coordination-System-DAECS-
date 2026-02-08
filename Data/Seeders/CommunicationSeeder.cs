using FYP_Project_II.Models;

namespace FYP_Project_II.Data.Seeders
{
    public static class CommunicationSeeder
    {
        public static async Task SeedCommunicationDataAsync(ApplicationDbContext dbContext)
        {
            var baseDate = new DateTime(2024, 1, 15, 8, 0, 0, DateTimeKind.Utc);

            // Seed SOS Requests
            if (!dbContext.SOSRequests.Any())
            {
                var sosRequests = new[]
                {
                    new SOSRequest { SOSRequestId = "SOS001", UserId = "user001", Location = "Taman Sri Muda, Shah Alam", Status = "New", CreatedAt = baseDate.AddHours(1), UpdatedAt = baseDate.AddHours(1) },
                    new SOSRequest { SOSRequestId = "SOS002", UserId = "user002", Location = "Kampung Baru, KL", Status = "In Progress", CreatedAt = baseDate.AddHours(2), UpdatedAt = baseDate.AddHours(3) },
                    new SOSRequest { SOSRequestId = "SOS003", UserId = "user003", Location = "Klang, Selangor", Status = "Resolved", CreatedAt = baseDate.AddHours(-5), UpdatedAt = baseDate.AddHours(-1) }
                };
                await dbContext.SOSRequests.AddRangeAsync(sosRequests);
                Console.WriteLine("Seeded SOS Requests");
            }

            // Seed Announcements
            if (!dbContext.Announcements.Any())
            {
                var announcements = new[]
                {
                    new Announcement { Id = "ANN001", Title = "Flood Warning", Content = "Heavy rain expected in Klang Valley.", Priority = "High", IsActive = true, CreatedBy = "System", CreatedAt = baseDate },
                    new Announcement { Id = "ANN002", Title = "Shelter Opening", Content = "Dewan Serbaguna Ampang is now open for evacuees.", Priority = "Medium", IsActive = true, CreatedBy = "System", CreatedAt = baseDate.AddHours(1) },
                    new Announcement { Id = "ANN003", Title = "Donation Drive", Content = "Collecting dry food and blankets.", Priority = "Low", IsActive = true, CreatedBy = "System", CreatedAt = baseDate.AddDays(-1) }
                };
                await dbContext.Announcements.AddRangeAsync(announcements);
                Console.WriteLine("Seeded Announcements");
            }

            // Seed Alerts
            if (!dbContext.Alerts.Any())
            {
                var alerts = new[]
                {
                    new Alert { AlertId = "ALERT001", Title = "Red Alert: Flood", Description = "Immediate evacuation required for Zone A.", Severity = "Critical", Status = "Active", CreatedAt = baseDate, UpdatedAt = baseDate },
                    new Alert { AlertId = "ALERT002", Title = "Yellow Alert: Heavy Rain", Description = "Prepare for potential flooding.", Severity = "Warning", Status = "Active", CreatedAt = baseDate.AddHours(-2), UpdatedAt = baseDate.AddHours(-2) }
                };
                await dbContext.Alerts.AddRangeAsync(alerts);
                Console.WriteLine("Seeded Alerts");
            }
        }
    }
}
