using FYP_Project_II.Models;

namespace FYP_Project_II.Data.Seeders
{
    public static class SystemSeeder
    {
        public static async Task SeedSystemDataAsync(ApplicationDbContext dbContext)
        {
            var baseDate = new DateTime(2024, 1, 15, 8, 0, 0, DateTimeKind.Utc);

            // Seed System Settings
            if (!dbContext.SystemSettings.Any())
            {
                var settings = new SystemSettings
                {
                    SystemName = "DAECS - Disaster Alert and Emergency Coordination System",
                    OrganizationName = "National Disaster Management Agency",
                    EmergencyContactNumber = "+60-3-8000-8000",
                    EnableNotifications = true,
                    UpdatedAt = baseDate
                };
                await dbContext.SystemSettings.AddAsync(settings);
                Console.WriteLine("Seeded System Settings");
            }

            // Seed Audit Logs
            Console.WriteLine("Checking if Audit Logs need seeding...");
            if (!dbContext.AuditLogs.Any())
            {
                Console.WriteLine("AuditLogs table is empty. Seeding...");
                var auditLogs = new[]
                {
                    new AuditLog { Id = "LOG001", Username = "admin001", Name = "Ahmad bin Abdullah", Action = "Create User", Module = "Admin Management", Details = "Created new user: responder002", Timestamp = new DateTime(2024, 12, 19, 10, 30, 0, DateTimeKind.Utc) },
                    new AuditLog { Id = "LOG002", Username = "responder001", Name = "Siti Nurhaliza", Action = "Update SOS Status", Module = "SOS Monitoring", Details = "Changed SOS002 status from New to In Progress", Timestamp = new DateTime(2024, 12, 19, 10, 0, 0, DateTimeKind.Utc) },
                    new AuditLog { Id = "LOG003", Username = "admin001", Name = "Ahmad bin Abdullah", Action = "Send Alert", Module = "Alert Broadcasting", Details = "Broadcast emergency alert: ALERT002", Timestamp = new DateTime(2024, 12, 19, 10, 15, 0, DateTimeKind.Utc) },
                    new AuditLog { Id = "LOG004", Username = "shelter001", Name = "Kumar Rajendran", Action = "Register Evacuee", Module = "Shelter Management", Details = "Registered evacuee EV001 at SHELTER001", Timestamp = new DateTime(2024, 12, 19, 8, 0, 0, DateTimeKind.Utc) },
                    new AuditLog { Id = "LOG005", Username = "resource001", Name = "Tan Mei Ling", Action = "Approve Resource Request", Module = "Resource Management", Details = "Approved request REQ002 and assigned to Team Alpha", Timestamp = new DateTime(2024, 12, 19, 9, 45, 0, DateTimeKind.Utc) }
                };

                await dbContext.AuditLogs.AddRangeAsync(auditLogs);
                await dbContext.SaveChangesAsync();
                Console.WriteLine($"Seeded {auditLogs.Length} audit logs successfully.");
            }
            else
            {
                Console.WriteLine("AuditLogs table already has data. Skipping.");
            }
        }
    }
}
