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
                    new Alert
                    {
                        AlertId = "ALERT001",
                        Title = "Flash Flood Warning - Kuala Lumpur",
                        Description = "Heavy rainfall expected in the next 2 hours. Residents in low-lying areas are advised to move to higher ground immediately.",
                        Severity = "Warning",
                        Status = "Sent",
                        TargetAudience = "Kuala Lumpur, Selangor",
                        CreatedBy = "Ahmad bin Abdullah",
                        SentAt = baseDate.AddHours(1),
                        CreatedAt = baseDate.AddMinutes(55),
                        UpdatedAt = baseDate.AddHours(1)
                    },
                    new Alert
                    {
                        AlertId = "ALERT002",
                        Title = "Evacuation Order - Kampung Baru",
                        Description = "Mandatory evacuation for Kampung Baru area. Report to nearest designated shelter immediately. Bring essential documents and medications.",
                        Severity = "Emergency",
                        Status = "Sent",
                        TargetAudience = "Kampung Baru residents",
                        CreatedBy = "Ahmad bin Abdullah",
                        SentAt = baseDate.AddHours(2).AddMinutes(15),
                        CreatedAt = baseDate.AddHours(2).AddMinutes(10),
                        UpdatedAt = baseDate.AddHours(2).AddMinutes(15)
                    },
                    new Alert
                    {
                        AlertId = "ALERT003",
                        Title = "Shelter Opening Notification",
                        Description = "Additional shelter facilities now open at Dewan Komuniti Taman Melati. Capacity for 200 evacuees.",
                        Severity = "Information",
                        Status = "Scheduled",
                        TargetAudience = "All Districts",
                        CreatedBy = "Kumar Rajendran",
                        ScheduledFor = baseDate.AddHours(6),
                        CreatedAt = baseDate.AddHours(2).AddMinutes(30),
                        UpdatedAt = baseDate.AddHours(2).AddMinutes(30)
                    },
                    new Alert
                    {
                        AlertId = "ALERT004",
                        Title = "Weather Update",
                        Description = "Storm warning canceled. Weather conditions improving.",
                        Severity = "All Clear",
                        Status = "Canceled",
                        TargetAudience = "Penang",
                        CreatedBy = "Ahmad bin Abdullah",
                        CreatedAt = baseDate.AddHours(-1),
                        UpdatedAt = baseDate.AddHours(-1)
                    }
                };
                await dbContext.Alerts.AddRangeAsync(alerts);
                Console.WriteLine("Seeded Alerts");
            }
        }
    }
}
