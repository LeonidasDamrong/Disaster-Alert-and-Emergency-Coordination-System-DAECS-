using Microsoft.AspNetCore.Identity;

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
        /// <summary>
        /// Validates credentials against the identity store via UserManager and SignInManager.
        /// Returns the ApplicationUser and role on success, or (null, null) on failure.
        /// </summary>
        public virtual async Task<(ApplicationUser? User, string? Role)> LoginAsync(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager)
        {
            if (userManager == null)
                throw new ArgumentNullException(nameof(userManager));
            if (signInManager == null)
                throw new ArgumentNullException(nameof(signInManager));

            var appUser = await userManager.FindByNameAsync(UserId);
            if (appUser == null)
                return (null, null);

            var result = await signInManager.CheckPasswordSignInAsync(appUser, Password, lockoutOnFailure: false);
            if (!result.Succeeded)
                return (null, null);

            var roles = await userManager.GetRolesAsync(appUser);
            var role = roles.FirstOrDefault() ?? "User";

            return (appUser, role);
        }

        /// <summary>
        /// Signs out the current user via SignInManager.
        /// With JWT, the client must also remove the token; this clears any server-side sign-in state.
        /// </summary>
        public virtual async Task LogoutAsync(SignInManager<ApplicationUser> signInManager)
        {
            if (signInManager == null)
                throw new ArgumentNullException(nameof(signInManager));

            await signInManager.SignOutAsync();
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
