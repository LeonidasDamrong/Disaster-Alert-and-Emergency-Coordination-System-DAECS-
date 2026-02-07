namespace FYP_Project_II.Models
{
    public class Announcement
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Title { get; set; }
        public string Content { get; set; }
        public string Priority { get; set; } // Low, Medium, High
        public bool IsActive { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ExpiresAt { get; set; }
    }
}
