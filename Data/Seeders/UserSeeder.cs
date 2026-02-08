using FYP_Project_II.Models;
using Microsoft.AspNetCore.Identity;

namespace FYP_Project_II.Data.Seeders
{
    public static class UserSeeder
    {
        public static async Task SeedUsersAndRolesAsync(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager)
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
                    UserName = "shelter002",
                    Email = "ali@daecs.gov.my",
                    Name = "Ali bin Abu",
                    PhoneNumber = "+60123456793",
                    EmailConfirmed = true,
                    CreatedAt = baseDate
                }, Role = "Shelter Manager", Password = "Shelter@123" },

                new { User = new ApplicationUser
                {
                    UserName = "shelter003",
                    Email = "chong@daecs.gov.my",
                    Name = "Chong Wei",
                    PhoneNumber = "+60123456794",
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
                }, Role = "Resource Manager", Password = "Resource@123" },
                new { User = new ApplicationUser
                {
                    UserName = "resource002",
                    Email = "ali@resource.daecs.gov.my",
                    Name = "Ali bin Rahman",
                    PhoneNumber = "+60123456795",
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
        }
    }
}
