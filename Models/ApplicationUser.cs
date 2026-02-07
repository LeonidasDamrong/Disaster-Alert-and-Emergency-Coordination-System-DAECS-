using Microsoft.AspNetCore.Identity;

namespace FYP_Project_II.Models
{
    public class ApplicationUser : IdentityUser
    {
        // Common properties for all users
        public string Name { get; set; } = string.Empty;
        // PhoneNumber is inherited from IdentityUser
        // Role is managed through AspNetRoles and AspNetUserRoles tables
    }
}
