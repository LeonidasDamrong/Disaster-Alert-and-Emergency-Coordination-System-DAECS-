using FYP_Project_II.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace FYP_Project_II.Data
{
    public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : IdentityDbContext<ApplicationUser>(options)
    {
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<Announcement> Announcements { get; set; }
        public DbSet<Shelter> Shelters { get; set; }
        public DbSet<ResourceItem> Resources { get; set; }
        public DbSet<ResourceRequest> ResourceRequests { get; set; }
        public DbSet<SOSRequest> SOSRequests { get; set; }
        public DbSet<Alert> Alerts { get; set; }
        public DbSet<SystemSettings> SystemSettings { get; set; }
    }
}
