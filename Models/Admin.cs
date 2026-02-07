using Microsoft.AspNetCore.Identity;

namespace FYP_Project_II.Models
{
    /// <summary>
    /// Admin class - manages system administration and user management
    /// </summary>
    public class Admin : User
    {
        // Additional properties specific to Admin
        // public string AdminLevel { get; set; }
        // public List<string> Permissions { get; set; }

        // Constructor
        public Admin() : base()
        {
            Role = "Admin";
            // AdminLevel = "Standard";
            // Permissions = new List<string>();
        }

        // Parameterized constructor
        public Admin(string userId, string username, string password, string phoneNo, string email, string adminLevel)
            : base(userId, username, password, phoneNo, email, "Admin")
        {
            // AdminLevel = adminLevel;
            // Permissions = new List<string>();
        }

        // Admin-specific methods
        public async Task<(bool Success, string Message, ApplicationUser? CreatedUser)> CreateUserAccount(User newUser, UserManager<ApplicationUser> userManager)
        {
            if (userManager == null)
                throw new ArgumentNullException(nameof(userManager));
            
            if (newUser == null)
                throw new ArgumentNullException(nameof(newUser));

            // Convert User object to ApplicationUser for Identity
            // All users have the same properties, only methods differ
            var applicationUser = new ApplicationUser
            {
                UserName = newUser.UserId,
                Email = newUser.Email,
                Name = newUser.Username,
                PhoneNumber = newUser.PhoneNo
            };

            // Create user in the database using Identity
            var result = await userManager.CreateAsync(applicationUser, newUser.Password);

            if (result.Succeeded)
            {
                Console.WriteLine($"User {newUser.Username} created successfully by Admin {this.Username}");
                return (true, $"User {newUser.Username} created successfully", applicationUser);
            }
            else
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                Console.WriteLine($"Failed to create user {newUser.Username}: {errors}");
                return (false, $"Failed to create user: {errors}", null);
            }
        }

        public async Task<(bool Success, string Message)> UpdateUserAccount(string userId, User updatedUserData, UserManager<ApplicationUser> userManager)
        {
            if (userManager == null)
                throw new ArgumentNullException(nameof(userManager));
            if (updatedUserData == null)
                throw new ArgumentNullException(nameof(updatedUserData));

            var appUser = await userManager.FindByNameAsync(userId);
            if (appUser == null)
                return (false, "User not found");

            appUser.Name = updatedUserData.Username;
            appUser.Email = updatedUserData.Email;
            appUser.PhoneNumber = updatedUserData.PhoneNo;

            var result = await userManager.UpdateAsync(appUser);

            if (result.Succeeded)
                return (true, $"User {userId} updated successfully");
            
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return (false, $"Failed to update user: {errors}");
        }

        public async Task<(bool Success, string Message)> DeleteUserAccount(string userId, UserManager<ApplicationUser> userManager)
        {
            if (userManager == null)
                throw new ArgumentNullException(nameof(userManager));

            var appUser = await userManager.FindByNameAsync(userId);
            if (appUser == null)
                return (false, "User not found");

            var result = await userManager.DeleteAsync(appUser);

            if (result.Succeeded)
                return (true, $"User {userId} deleted successfully");

            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return (false, $"Failed to delete user: {errors}");
        }

        public void AssignUserRoles(string userId, string role)
        {
            // TODO: Implement user role assignment logic
            // Will be implemented when the user is created by the admin
            // Will also be used to reassign the role of the user if the user is already created
            Console.WriteLine($"User {userId} assigned role {role}");
        }

        public void ViewAuditLogs()
        {
            // TODO: Implement audit logs viewing logic
            // Need to create a table for audit logs in the database
            Console.WriteLine($"Audit logs viewed");
        }

        // public void GenerateSystemReport(string reportType)
        // {
        //     // TODO: Implement system report generation logic
        //     Console.WriteLine($"Generating {reportType} report...");
        // }

        // public void ManageSystemSettings(string settingName, string settingValue)
        // {
        //     // TODO: Implement system settings management logic
        //     Console.WriteLine($"System setting {settingName} updated to {settingValue}");
        // }
    }
}
