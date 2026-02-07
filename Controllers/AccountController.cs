using FYP_Project_II.Data;
using FYP_Project_II.DTOs;
using FYP_Project_II.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace FYP_Project_II.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public AccountController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            RoleManager<IdentityRole> roleManager,
            ApplicationDbContext context,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _roleManager = roleManager;
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrEmpty(request.UserId) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { message = "User ID and password are required" });
            }

            // Route login through User model
            var user = new User
            {
                UserId = request.UserId,
                Password = request.Password
            };

            var (appUser, role) = await user.LoginAsync(_userManager, _signInManager);

            if (appUser == null || role == null)
            {
                return Unauthorized(new { message = "Invalid User ID or Password" });
            }

            // Generate JWT token
            var token = GenerateJwtToken(appUser, role);

            return Ok(new LoginResponse
            {
                Token = token,
                UserId = appUser.UserName ?? string.Empty,
                Name = appUser.Name,
                Email = appUser.Email ?? string.Empty,
                Role = role,
                Phone = appUser.PhoneNumber ?? string.Empty
            });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (string.IsNullOrEmpty(request.UserId) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { message = "User ID and password are required" });
            }

            // Check if user already exists
            var existingUser = await _userManager.FindByNameAsync(request.UserId);
            if (existingUser != null)
            {
                return BadRequest(new { message = "User ID already exists" });
            }

            // Get the current logged-in user (should be an Admin)
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            ApplicationUser? currentAppUser = null;
            
            if (!string.IsNullOrEmpty(currentUserId))
            {
                currentAppUser = await _userManager.FindByIdAsync(currentUserId);
            }

            // Create Admin object (either from current user or a system admin for self-registration)
            var admin = new Admin
            {
                UserId = currentAppUser?.UserName ?? "system",
                Username = currentAppUser?.Name ?? "System Administrator",
                Email = currentAppUser?.Email ?? "system@daecs.com",
                PhoneNo = currentAppUser?.PhoneNumber ?? "",
                Password = "" // Not needed for admin object
            };

            // Create the appropriate User object based on role
            // All users have same properties, only methods differ
            User newUser = request.Role switch
            {
                "Admin" => new Admin(
                    request.UserId,
                    request.Name,
                    request.Password,
                    request.Phone,
                    request.Email,
                    "Standard"
                ),
                "Shelter Manager" => new ShelterManager(
                    request.UserId,
                    request.Name,
                    request.Password,
                    request.Phone,
                    request.Email,
                    "",
                    "",
                    0
                ),
                "Resource Manager" => new ResourceManager(
                    request.UserId,
                    request.Name,
                    request.Password,
                    request.Phone,
                    request.Email,
                    "",
                    ""
                ),
                "Emergency Officer" => new FirstResponder(
                    request.UserId,
                    request.Name,
                    request.Password,
                    request.Phone,
                    request.Email,
                    "General"
                ),
                "Disaster Manager" => new DisasterManager(
                    request.UserId,
                    request.Name,
                    request.Password,
                    request.Phone,
                    request.Email,
                    ""
                ),
                _ => throw new ArgumentException($"Invalid role: {request.Role}")
            };

            // Use Admin's CreateUserAccount method
            var (success, message, createdUser) = await admin.CreateUserAccount(newUser, _userManager);

            if (success && createdUser != null)
            {
                // Assign role to the newly created user
                await _userManager.AddToRoleAsync(createdUser, request.Role);

                // Log to audit
                var currentUserName = currentAppUser?.Name ?? "System";
                currentUserId = currentAppUser?.UserName ?? "system";
                _context.AuditLogs.Add(new AuditLog
                {
                    UserId = currentUserId,
                    UserName = currentUserName,
                    Action = "Create User",
                    Module = "Admin Management",
                    Details = $"Created new user: {request.UserId}",
                    Timestamp = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();

                return Ok(new { message });
            }
            else
            {
                return BadRequest(new { message });
            }
        }


        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
            {
                return Unauthorized();
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound();
            }

            // Get user roles
            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? "User";

            return Ok(new
            {
                userId = user.UserName,
                name = user.Name,
                email = user.Email,
                role = role,
                phone = user.PhoneNumber
            });
        }

        [HttpGet("users")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userManager.Users.ToListAsync();
            
            var userList = new List<object>();
            foreach (var u in users)
            {
                var roles = await _userManager.GetRolesAsync(u);
                var role = roles.FirstOrDefault() ?? "User";
                
                userList.Add(new
                {
                    id = u.Id,
                    userId = u.UserName,
                    name = u.Name,
                    email = u.Email,
                    role = role,
                    phone = u.PhoneNumber,
                    createdAt = u.CreatedAt.ToString("o")
                });
            }
            
            return Ok(userList);
        }

        [HttpGet("roles")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetRoles()
        {
            var allRoles = await _roleManager.Roles
                .Select(r => r.Name)
                .Where(n => n != null)
                .OrderBy(n => n)
                .ToListAsync();

            var currentUserId = User.FindFirst(ClaimTypes.Name)?.Value;
            var isSystemAdmin = currentUserId == "systemadmin";

            // Only system admin can see Admin role in dropdown
            var roles = isSystemAdmin
                ? allRoles
                : allRoles.Where(r => r != "Admin").ToList();
            
            return Ok(roles);
        }

        [HttpGet("next-user-id")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetNextUserId([FromQuery] string role)
        {
            if (string.IsNullOrEmpty(role))
                return BadRequest(new { message = "Role is required" });

            var prefix = role switch
            {
                "Admin" => "admin",
                "Emergency Officer" => "officer",
                "Shelter Manager" => "shelter",
                "Resource Manager" => "resource",
                "Disaster Manager" => "disaster",
                _ => "user"
            };

            var usersWithPrefix = await _userManager.Users
                .Where(u => u.UserName != null && u.UserName.StartsWith(prefix))
                .Select(u => u.UserName)
                .ToListAsync();

            var maxNumber = 0;
            foreach (var username in usersWithPrefix ?? [])
            {
                if (username != null && username.Length > prefix.Length)
                {
                    var suffix = username[prefix.Length..];
                    if (int.TryParse(suffix, out var num) && num > maxNumber)
                        maxNumber = num;
                }
            }

            var nextUserId = $"{prefix}{maxNumber + 1:D3}";
            return Ok(new { nextUserId });
        }

        [HttpPut("users/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateUser(string userId, [FromBody] UpdateUserRequest request)
        {
            if (string.IsNullOrEmpty(userId))
                return BadRequest(new { message = "User ID is required" });

            var admin = new Admin();
            var updatedUserData = new User
            {
                Username = request.Name,
                Email = request.Email,
                PhoneNo = request.Phone
            };

            var (success, message) = await admin.UpdateUserAccount(userId, updatedUserData, _userManager);

            if (success)
            {
                var currentUserId = User.FindFirst(ClaimTypes.Name)?.Value ?? "system";
                var currentUserName = User.FindFirst("Name")?.Value ?? "System";
                _context.AuditLogs.Add(new AuditLog
                {
                    UserId = currentUserId,
                    UserName = currentUserName,
                    Action = "Update User",
                    Module = "Admin Management",
                    Details = $"Updated user: {userId}",
                    Timestamp = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();
                return Ok(new { message });
            }
            return BadRequest(new { message });
        }

        [HttpDelete("users/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUser(string userId)
        {
            if (string.IsNullOrEmpty(userId))
                return BadRequest(new { message = "User ID is required" });

            var admin = new Admin();
            var (success, message) = await admin.DeleteUserAccount(userId, _userManager);

            if (success)
            {
                var currentUserId = User.FindFirst(ClaimTypes.Name)?.Value ?? "system";
                var currentUserName = User.FindFirst("Name")?.Value ?? "System";
                _context.AuditLogs.Add(new AuditLog
                {
                    UserId = currentUserId,
                    UserName = currentUserName,
                    Action = "Delete User",
                    Module = "Admin Management",
                    Details = $"Deleted user: {userId}",
                    Timestamp = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();
                return Ok(new { message });
            }
            return BadRequest(new { message });
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var userId = User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Ok(new { message = "Logged out successfully" });
            }

            // Route logout through User model
            var user = new User { UserId = userId };
            await user.LogoutAsync(_signInManager);

            return Ok(new { message = "Logged out successfully" });
        }

        private string GenerateJwtToken(ApplicationUser user, string role)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var key = Encoding.ASCII.GetBytes(jwtSettings["Key"] ?? throw new InvalidOperationException("JWT Key not configured"));

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id),
                    new Claim(ClaimTypes.Name, user.UserName ?? string.Empty),
                    new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
                    new Claim(ClaimTypes.Role, role),
                    new Claim("Name", user.Name),
                    new Claim("Phone", user.PhoneNumber ?? string.Empty)
                }),
                Expires = DateTime.UtcNow.AddHours(double.Parse(jwtSettings["ExpiryInHours"] ?? "24")),
                Issuer = jwtSettings["Issuer"],
                Audience = jwtSettings["Audience"],
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}
