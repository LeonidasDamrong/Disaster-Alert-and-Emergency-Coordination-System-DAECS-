using FYP_Project_II.Data;
using Microsoft.EntityFrameworkCore;

namespace FYP_Project_II.Models
{
    public class AuditLog
    {
        public string Id { get; set; } = string.Empty; // Will be set by GenerateNextIdAsync
        public string Username { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string Module { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public static async Task<string> GenerateNextIdAsync(ApplicationDbContext context)
        {
            var lastLog = await context.AuditLogs
                .OrderByDescending(l => l.Id)
                .FirstOrDefaultAsync();

            int nextId = 1;
            if (lastLog != null && lastLog.Id.StartsWith("LOG"))
            {
                if (int.TryParse(lastLog.Id.Substring(3), out int currentId))
                {
                    nextId = currentId + 1;
                }
            }

            return $"LOG{nextId:D3}";
        }
    }
}
