using FYP_Project_II.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FYP_Project_II.Data
{
    public static class DbInitializer
    {
        public static async Task SeedUsersAsync(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            ApplicationDbContext dbContext)
        {
            // Define all roles
            string[] roleNames = { "System Admin", "Admin", "First Responder", "Shelter Manager", "Resource Manager", "Disaster Manager" };

            // Create roles if they don't exist
            foreach (var roleName in roleNames)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    await roleManager.CreateAsync(new IdentityRole(roleName));
                    Console.WriteLine($"Created role: {roleName}");
                }
            }

            var baseDate = new DateTime(2024, 1, 15, 8, 0, 0, DateTimeKind.Utc);

            // Always ensure system admin exists
            var systemAdmin = await userManager.FindByNameAsync("systemadmin");
            if (systemAdmin == null)
            {
                var sysAdminUser = new ApplicationUser
                {
                    UserName = "systemadmin",
                    Email = "system@daecs.gov.my",
                    Name = "System Administrator",
                    PhoneNumber = "+60000000000",
                    EmailConfirmed = true,
                    CreatedAt = baseDate
                };
                var result = await userManager.CreateAsync(sysAdminUser, "System@123");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(sysAdminUser, "System Admin");
                    Console.WriteLine("Created system admin: systemadmin");
                }
            }

            // Check if other users already exist
            if (userManager.Users.Count() > 1)
            {
                // Seed audit logs if empty
                await SeedAuditLogsIfEmpty(dbContext);
                return;
            }

            // Seed regular users
            var usersWithRoles = new[]
            {
                new { User = new ApplicationUser
                {
                    UserName = "admin001",
                    Email = "ahmad@daecs.gov.my",
                    Name = "Ahmad bin Abdullah",
                    PhoneNumber = "+60123456789",
                    EmailConfirmed = true,
                    CreatedAt = baseDate
                }, Role = "Admin", Password = "Admin@123" },
                new { User = new ApplicationUser
                {
                    UserName = "responder001",
                    Email = "siti@daecs.gov.my",
                    Name = "Siti Nurhaliza",
                    PhoneNumber = "+60123456790",
                    EmailConfirmed = true,
                    CreatedAt = baseDate
                }, Role = "First Responder", Password = "Responder@123" },
                
                new { User = new ApplicationUser
                {
                    UserName = "shelter001",
                    Email = "kumar@daecs.gov.my",
                    Name = "Kumar Rajendran",
                    PhoneNumber = "+60123456791",
                    EmailConfirmed = true,
                    CreatedAt = baseDate
                }, Role = "Shelter Manager", Password = "Shelter@123" },
                
                new { User = new ApplicationUser
                {
                    UserName = "resource001",
                    Email = "tan@daecs.gov.my",
                    Name = "Tan Mei Ling",
                    PhoneNumber = "+60123456792",
                    EmailConfirmed = true,
                    CreatedAt = baseDate
                }, Role = "Resource Manager", Password = "Resource@123" }
            };

            foreach (var item in usersWithRoles)
            {
                var result = await userManager.CreateAsync(item.User, item.Password);

                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(item.User, item.Role);
                    Console.WriteLine($"Created user: {item.User.UserName} with role: {item.Role}");
                }
                else
                {
                    Console.WriteLine($"Failed to create user {item.User.UserName}: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                }
            }

            await SeedDummyDataAsync(dbContext);
        }

        private static async Task SeedAuditLogsIfEmpty(ApplicationDbContext dbContext)
        {
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

        private static async Task SeedDummyDataAsync(ApplicationDbContext dbContext)
        {
            var baseDate = new DateTime(2024, 1, 15, 8, 0, 0, DateTimeKind.Utc);

            // Seed Audit Logs
            await SeedAuditLogsIfEmpty(dbContext);

            // Seed Shelters
            if (!dbContext.Shelters.Any())
            {
                var shelters = new[]
                {
                    new Shelter { ShelterId = "SHELTER001", Name = "Dewan Serbaguna Ampang", Location = "Ampang, Selangor", Capacity = 500, AvailableCapacity = 450, Status = "Open", CreatedAt = baseDate, UpdatedAt = baseDate },
                    new Shelter { ShelterId = "SHELTER002", Name = "SK Bukit Indah", Location = "Ampang, Selangor", Capacity = 300, AvailableCapacity = 100, Status = "Full", CreatedAt = baseDate, UpdatedAt = baseDate },
                    new Shelter { ShelterId = "SHELTER003", Name = "Masjid Jamek KL", Location = "Kuala Lumpur", Capacity = 200, AvailableCapacity = 200, Status = "Closed", CreatedAt = baseDate, UpdatedAt = baseDate }
                };
                await dbContext.Shelters.AddRangeAsync(shelters);
                Console.WriteLine("Seeded Shelters");
            }

            // Seed Resources
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

            await dbContext.SaveChangesAsync();
        }
    }
}
