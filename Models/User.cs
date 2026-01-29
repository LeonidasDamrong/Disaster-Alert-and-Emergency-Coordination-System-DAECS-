namespace FYP_Project_II.Models
{
    /// <summary>
    /// Base User class representing common user attributes and behaviors
    /// </summary>
    public class User
    {
        // Properties
        public string UserId { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
        public string PhoneNo { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }

        // Constructor
        public User()
        {
            UserId = string.Empty;
            Username = string.Empty;
            Password = string.Empty;
            PhoneNo = string.Empty;
            Email = string.Empty;
            Role = string.Empty;
        }

        // Parameterized constructor
        public User(string userId, string username, string password, string phoneNo, string email, string role)
        {
            UserId = userId;
            Username = username;
            Password = password;
            PhoneNo = phoneNo;
            Email = email;
            Role = role;
        }

        // Methods
        public virtual bool Login()
        {
            // TODO: Implement login logic
            // This would typically validate credentials against a database
            Console.WriteLine($"User {Username} attempting to login...");
            return true;
        }

        public virtual void Logout()
        {
            // TODO: Implement logout logic
            // This would typically clear session/authentication tokens
            Console.WriteLine($"User {Username} logged out successfully.");
        }

        public virtual bool ChangePassword(string oldPassword, string newPassword)
        {
            // TODO: Implement password change logic
            // This would typically validate old password and update with new one
            if (Password == oldPassword)
            {
                Password = newPassword;
                Console.WriteLine("Password changed successfully.");
                return true;
            }
            Console.WriteLine("Old password is incorrect.");
            return false;
        }

        public virtual string GetRole()
        {
            return Role;
        }
    }
}
