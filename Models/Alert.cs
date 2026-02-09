namespace FYP_Project_II.Models
{
    public class Alert
    {
        public string AlertId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty; // Emergency, Warning, Information, All Clear
        public string Status { get; set; } = string.Empty;   // Sent, Scheduled, Canceled
        public string TargetAudience { get; set; } = string.Empty;
        public string? CreatedBy { get; set; }
        public DateTime? ScheduledFor { get; set; }
        public DateTime? SentAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
