using FYP_Project_II.Data;
using FYP_Project_II.Hubs;
using FYP_Project_II.Models;
using FYP_Project_II.Services;
using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Get connection string
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

// Configure DbContext with Azure SQL retry logic
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString, sqlServerOptions =>
    {
        // Enable retry on failure for Azure SQL
        sqlServerOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: null);

        // Set command timeout
        sqlServerOptions.CommandTimeout(60);
    }));

builder.Services.AddDatabaseDeveloperPageExceptionFilter();

// Configure Identity
builder.Services.AddDefaultIdentity<ApplicationUser>(options =>
{
    // Sign-in settings
    options.SignIn.RequireConfirmedAccount = false; // Set to true if you have email configured

    // Password settings
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false; // Changed to false for easier testing
    options.Password.RequiredLength = 6; // Minimum 6 characters
})
.AddRoles<IdentityRole>() // Add role management
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddSignInManager<SignInManager<ApplicationUser>>();

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.ASCII.GetBytes(jwtSettings["Key"] ?? throw new InvalidOperationException("JWT Key not configured"));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false; // Set to true in production
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
    // SignalR sends token via query string (WebSockets don't support headers)
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

// Configure CORS for React, Flutter web, and other localhost clients (any port)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
              {
                  if (string.IsNullOrEmpty(origin)) return false;
                  try
                  {
                      var uri = new Uri(origin);
                      return uri.Host == "localhost" || uri.Host == "127.0.0.1";
                  }
                  catch { return false; }
              })
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllersWithViews();
builder.Services.AddRazorPages();
builder.Services.AddHostedService<AlertBroadcastBackgroundService>();

// FCM push notifications for alerts (topic "alerts"). Configure Firebase:ProjectId and ServiceAccountJsonPath or ServiceAccountJson.
builder.Services.Configure<FYP_Project_II.Services.FirebaseOptions>(builder.Configuration.GetSection(FYP_Project_II.Services.FirebaseOptions.SectionName));
builder.Services.AddHttpClient<FYP_Project_II.Services.IFcmSender, FYP_Project_II.Services.FcmService>();

// Azure Blob Storage (for SOS completion proof images)
var blobConnectionString = builder.Configuration.GetConnectionString("AzureBlobStorage");
if (!string.IsNullOrWhiteSpace(blobConnectionString))
{
    builder.Services.AddSingleton(new BlobServiceClient(blobConnectionString));
}

// SignalR for real-time SOS updates (use Azure SignalR in production via connection string)
var signalRConnection = builder.Configuration.GetConnectionString("AzureSignalR");
if (!string.IsNullOrEmpty(signalRConnection))
{
    builder.Services.AddSignalR().AddAzureSignalR(signalRConnection);
}
else
{
    builder.Services.AddSignalR();
}

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseMigrationsEndPoint();
}
else
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();

// Enable CORS
app.UseCors("AllowReactApp");

app.UseAuthentication(); // Important: Must come before UseAuthorization
app.UseAuthorization();

// Commented out: This was conflicting with SPA fallback and serving the old MVC view
// app.MapControllerRoute(
//     name: "default",
//     pattern: "{controller=Home}/{action=Index}/{id?}");

// Enable API controllers (for /api/* endpoints)
app.MapControllers();

// SignalR hubs
app.MapHub<SOSHub>("/hubs/sos");
app.MapHub<SOSVictimHub>("/hubs/sos-victim");
app.MapHub<ResourceHub>("/hubs/resources");
app.MapHub<NotificationHub>("/hubs/notifications");

app.MapRazorPages();

// SPA fallback for React Router - catch all routes and serve index
app.MapFallbackToFile("index.html");

// Apply migrations and seed database
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    
    try
    {
        var dbContext = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

        logger.LogInformation("Starting database initialization...");

        // Apply any pending migrations
        if (app.Environment.IsProduction())
        {
            await dbContext.Database.MigrateAsync();
            logger.LogInformation("Migrations applied successfully");
        }

        // Seed initial users and roles
        logger.LogInformation("Starting user and role seeding...");
        await DbInitializer.SeedUsersAsync(userManager, roleManager, dbContext);
        logger.LogInformation("Database seeding completed");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred during database initialization");
    }
}

app.Run();
