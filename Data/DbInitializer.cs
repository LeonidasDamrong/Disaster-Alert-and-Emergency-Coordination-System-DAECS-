using FYP_Project_II.Models;
using Microsoft.AspNetCore.Identity;

namespace FYP_Project_II.Data
{
    public static class DbInitializer
    {
        public static async Task SeedUsersAsync(UserManager<ApplicationUser> userManager)
        {
            // Check if users already exist
            if (userManager.Users.Any())
            {
                return; // Database has been seeded
            }

            // Seed users from mock data
            var users = new[]
            {
                new ApplicationUser
                {
                    UserName = "admin001",
                    Email = "ahmad@daecs.gov.my",
                    Name = "Ahmad bin Abdullah",
                    Phone = "+60123456789",
                    Role = "Admin",
                    EmailConfirmed = true
                },
                new ApplicationUser
                {
                    UserName = "officer001",
                    Email = "siti@daecs.gov.my",
                    Name = "Siti Nurhaliza",
                    Phone = "+60123456790",
                    Role = "Emergency Officer",
                    EmailConfirmed = true
                },
                new ApplicationUser
                {
                    UserName = "shelter001",
                    Email = "kumar@daecs.gov.my",
                    Name = "Kumar Rajendran",
                    Phone = "+60123456791",
                    Role = "Shelter Manager",
                    EmailConfirmed = true
                },
                new ApplicationUser
                {
                    UserName = "resource001",
                    Email = "tan@daecs.gov.my",
                    Name = "Tan Mei Ling",
                    Phone = "+60123456792",
                    Role = "Resource Manager",
                    EmailConfirmed = true
                }
            };

            foreach (var user in users)
            {
                // Create user with password based on role
                string password = GetPasswordForRole(user.Role);
                var result = await userManager.CreateAsync(user, password);

                if (result.Succeeded)
                {
                    Console.WriteLine($"Created user: {user.UserName}");
                }
                else
                {
                    Console.WriteLine($"Failed to create user {user.UserName}: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                }
            }
        }

        private static string GetPasswordForRole(string role)
        {
            // Simple password pattern: RoleName@123
            // In production, these should be more secure and stored securely
            return role switch
            {
                "Admin" => "Admin@123",
                "Emergency Officer" => "Officer@123",
                "Shelter Manager" => "Shelter@123",
                "Resource Manager" => "Resource@123",
                _ => "Default@123"
            };
        }
    }
}
