namespace FYP_Project_II.Models
{
    public class Announcement
    {
        public string AnnouncementId { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string Severity { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
