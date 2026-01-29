namespace FYP_Project_II.Models
{
    /// <summary>
    /// Admin class - manages system administration and user management
    /// </summary>
    public class Admin : User
    {
        // Additional properties specific to Admin
        public string AdminLevel { get; set; }
        public List<string> Permissions { get; set; }

        // Constructor
        public Admin() : base()
        {
            Role = "Admin";
            AdminLevel = "Standard";
            Permissions = new List<string>();
        }

        // Parameterized constructor
        public Admin(string userId, string username, string password, string phoneNo, string email, string adminLevel)
            : base(userId, username, password, phoneNo, email, "Admin")
        {
            AdminLevel = adminLevel;
            Permissions = new List<string>();
        }

        // Admin-specific methods
        public void CreateUser(User newUser)
        {
            // TODO: Implement user creation logic
            Console.WriteLine($"User {newUser.Username} created successfully");
        }

        public void DeleteUser(string userId)
        {
            // TODO: Implement user deletion logic
            Console.WriteLine($"User {userId} deleted");
        }

        public void ModifyUserPermissions(string userId, List<string> permissions)
        {
            // TODO: Implement permission modification logic
            Console.WriteLine($"Permissions updated for user {userId}");
        }

        public void GenerateSystemReport(string reportType)
        {
            // TODO: Implement system report generation logic
            Console.WriteLine($"Generating {reportType} report...");
        }

        public void ManageSystemSettings(string settingName, string settingValue)
        {
            // TODO: Implement system settings management logic
            Console.WriteLine($"System setting {settingName} updated to {settingValue}");
        }
    }
}
