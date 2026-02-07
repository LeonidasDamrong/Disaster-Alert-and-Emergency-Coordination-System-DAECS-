namespace FYP_Project_II.Models
{
    public class SOSLog
    {
        public string SOSLogId { get; set; }
        public string UserId { get; set; }
        public string Location { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
