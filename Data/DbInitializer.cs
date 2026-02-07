using FYP_Project_II.Models;
using Microsoft.AspNetCore.Identity;

namespace FYP_Project_II.Data
{
    public static class DbInitializer
    {
        public static async Task SeedUsersAsync(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager)
        {
            // Define all roles
            string[] roleNames = { "Admin", "Emergency Officer", "Shelter Manager", "Resource Manager", "Disaster Manager" };

            // Create roles if they don't exist
            foreach (var roleName in roleNames)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    await roleManager.CreateAsync(new IdentityRole(roleName));
                    Console.WriteLine($"Created role: {roleName}");
                }
            }

            // Check if users already exist
            if (userManager.Users.Any())
            {
                return; // Database has been seeded
            }

            // Seed users from mock data
            var usersWithRoles = new[]
            {
                new { User = new ApplicationUser
                {
                    UserName = "admin001",
                    Email = "ahmad@daecs.gov.my",
                    Name = "Ahmad bin Abdullah",
                    PhoneNumber = "+60123456789",
                    EmailConfirmed = true
                }, Role = "Admin", Password = "Admin@123" },
                
                new { User = new ApplicationUser
                {
                    UserName = "officer001",
                    Email = "siti@daecs.gov.my",
                    Name = "Siti Nurhaliza",
                    PhoneNumber = "+60123456790",
                    EmailConfirmed = true
                }, Role = "Emergency Officer", Password = "Officer@123" },
                
                new { User = new ApplicationUser
                {
                    UserName = "shelter001",
                    Email = "kumar@daecs.gov.my",
                    Name = "Kumar Rajendran",
                    PhoneNumber = "+60123456791",
                    EmailConfirmed = true
                }, Role = "Shelter Manager", Password = "Shelter@123" },
                
                new { User = new ApplicationUser
                {
                    UserName = "resource001",
                    Email = "tan@daecs.gov.my",
                    Name = "Tan Mei Ling",
                    PhoneNumber = "+60123456792",
                    EmailConfirmed = true
                }, Role = "Resource Manager", Password = "Resource@123" }
            };

            foreach (var item in usersWithRoles)
            {
                // Create user
                var result = await userManager.CreateAsync(item.User, item.Password);

                if (result.Succeeded)
                {
                    // Assign role to user
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
