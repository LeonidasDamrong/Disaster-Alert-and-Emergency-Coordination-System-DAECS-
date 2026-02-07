using FYP_Project_II.DTOs;
using FYP_Project_II.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
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
        private readonly IConfiguration _configuration;

        public AccountController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrEmpty(request.UserId) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { message = "User ID and password are required" });
            }

            // Find user by UserName (we'll use UserName field to store userId)
            var user = await _userManager.FindByNameAsync(request.UserId);
            if (user == null)
            {
                return Unauthorized(new { message = "Invalid User ID or Password" });
            }

            // Check password
            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
            if (!result.Succeeded)
            {
                return Unauthorized(new { message = "Invalid User ID or Password" });
            }

            // Get user roles
            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? "User"; // Get first role or default

            // Generate JWT token
            var token = GenerateJwtToken(user, role);

            return Ok(new LoginResponse
            {
                Token = token,
                UserId = user.UserName ?? string.Empty,
                Name = user.Name,
                Email = user.Email ?? string.Empty,
                Role = role,
                Phone = user.PhoneNumber ?? string.Empty
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
                    "Standard" // AdminLevel parameter
                ),
                "Shelter Manager" => new ShelterManager(
                    request.UserId,
                    request.Name,
                    request.Password,
                    request.Phone,
                    request.Email,
                    "", // ShelterId - not stored, only methods differ
                    "", // ShelterLocation
                    0   // MaxCapacity
                ),
                "Resource Manager" => new ResourceManager(
                    request.UserId,
                    request.Name,
                    request.Password,
                    request.Phone,
                    request.Email,
                    "", // WarehouseId
                    ""  // WarehouseLocation
                ),
                "Emergency Officer" => new FirstResponder(
                    request.UserId,
                    request.Name,
                    request.Password,
                    request.Phone,
                    request.Email,
                    "General" // Specialization
                ),
                "Disaster Manager" => new DisasterManager(
                    request.UserId,
                    request.Name,
                    request.Password,
                    request.Phone,
                    request.Email,
                    "" // AssignedRegion
                ),
                _ => throw new ArgumentException($"Invalid role: {request.Role}")
            };

            // Use Admin's CreateUser method
            var (success, message, createdUser) = await admin.CreateUser(newUser, _userManager);

            if (success && createdUser != null)
            {
                // Assign role to the newly created user
                await _userManager.AddToRoleAsync(createdUser, request.Role);
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
            var users = _userManager.Users.ToList();
            
            var userList = new List<object>();
            foreach (var u in users)
            {
                var roles = await _userManager.GetRolesAsync(u);
                var role = roles.FirstOrDefault() ?? "User";
                
                userList.Add(new
                {
                    userId = u.UserName,
                    name = u.Name,
                    email = u.Email,
                    role = role,
                    phone = u.PhoneNumber
                });
            }
            
            return Ok(userList);
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            // With JWT, logout is handled client-side by removing the token
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
