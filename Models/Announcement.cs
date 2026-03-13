namespace FYP_Project_II.Models
{
    public class Announcement
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty; // Low, Medium, High
        public bool IsActive { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ExpiresAt { get; set; }
    }
}
