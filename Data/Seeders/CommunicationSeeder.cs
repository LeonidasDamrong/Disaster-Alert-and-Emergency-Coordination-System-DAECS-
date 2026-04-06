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
                var proofSvg = "data:image/svg+xml;utf8," +
                               "<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='700'>" +
                               "<rect width='100%25' height='100%25' fill='%23f3f4f6'/>" +
                               "<text x='50%25' y='45%25' dominant-baseline='middle' text-anchor='middle' " +
                               "font-family='Arial' font-size='44' fill='%23111827'>SOS Completion Proof</text>" +
                               "<text x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' " +
                               "font-family='Arial' font-size='28' fill='%234b5563'>Dummy seeded image (SOS0003)</text>" +
                               "</svg>";

                var sosRequests = new[]
                {
                    new SOSRequest { SOSRequestId = "SOS0001", UserId = "user001", VictimName = "Lee Wei Ming", VictimContact = "+60198765432", Location = "Taman Sri Muda, Shah Alam", Latitude = 3.0567m, Longitude = 101.5335m, UrgencyLevel = "Critical", SOSStatus = "New", RequestedAt = baseDate.AddHours(1), CreatedAt = baseDate.AddHours(1), UpdatedAt = baseDate.AddHours(1) },
                    new SOSRequest { SOSRequestId = "SOS0002", UserId = "user002", VictimName = "Fatimah binti Hassan", VictimContact = "+60187654321", Location = "Kampung Baru, KL", Latitude = 3.1642m, Longitude = 101.7041m, UrgencyLevel = "High", SOSStatus = "In Progress", AssignedResponderId = "responder001", RequestedAt = baseDate.AddHours(2), CreatedAt = baseDate.AddHours(2), UpdatedAt = baseDate.AddHours(3) },
                    new SOSRequest
                    {
                        SOSRequestId = "SOS0003",
                        UserId = "user003",
                        VictimName = "Wong Ah Kau",
                        VictimContact = "+60176543210",
                        Location = "Klang, Selangor",
                        Latitude = 3.0357m,
                        Longitude = 101.4414m,
                        UrgencyLevel = "Medium",
                        SOSStatus = "Completed",
                        SolvedBy = "responder001",
                        CompletionProofImageUrl = proofSvg,
                        CompletionProofUploadedAt = baseDate.AddHours(-1),
                        CompletionProofUploadedBy = "responder001",
                        RequestedAt = baseDate.AddHours(-5),
                        SolvedAt = baseDate.AddHours(-1),
                        CreatedAt = baseDate.AddHours(-5),
                        UpdatedAt = baseDate.AddHours(-1)
                    }
                };
                await dbContext.SOSRequests.AddRangeAsync(sosRequests);
                Console.WriteLine("Seeded SOS Requests");
            }

            // Seed Announcements
            if (!dbContext.Announcements.Any())
            {
                var announcements = new[]
                {
                    new Announcement
                    {
                        Id = "ANN001",
                        Title = "System Maintenance Window",
                        Content = "Admin portal maintenance is scheduled tonight (02:00–04:00 MYT). During this window, broadcast scheduling and driver assignment updates may be delayed.",
                        Priority = "Medium",
                        IsActive = true,
                        CreatedBy = "System",
                        CreatedAt = baseDate
                    },
                    new Announcement
                    {
                        Id = "ANN002",
                        Title = "Admin On-Call Rotation Updated",
                        Content = "System Admin has updated the on-call duty roster for Alert Broadcasting approvals. Please review the Admin Management module for the latest assignments.",
                        Priority = "High",
                        IsActive = true,
                        CreatedBy = "System",
                        CreatedAt = baseDate.AddHours(1)
                    },
                    new Announcement
                    {
                        Id = "ANN003",
                        Title = "Audit Logging Policy Reminder",
                        Content = "All changes in SOS Monitoring, Alert Broadcasting, Shelter, and Resource modules are recorded in Audit Logs. Ensure actions are performed using your own account.",
                        Priority = "Low",
                        IsActive = true,
                        CreatedBy = "System",
                        CreatedAt = baseDate.AddDays(-1)
                    }
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
                    },
                    new Alert
                    {
                        AlertId = "ALERT005",
                        Title = "Donation Drop-off Points - Klang Valley",
                        Description = "Donation drop-off points are active for dry food, bottled water, blankets, and hygiene kits. Please follow instructions at the collection point and keep lanes clear for emergency vehicles.",
                        Severity = "Information",
                        Status = "Sent",
                        TargetAudience = "Klang Valley",
                        CreatedBy = "Kumar Rajendran",
                        SentAt = baseDate.AddHours(3),
                        CreatedAt = baseDate.AddHours(2).AddMinutes(50),
                        UpdatedAt = baseDate.AddHours(3)
                    }
                };
                await dbContext.Alerts.AddRangeAsync(alerts);
                Console.WriteLine("Seeded Alerts");
            }
        }
    }
}
