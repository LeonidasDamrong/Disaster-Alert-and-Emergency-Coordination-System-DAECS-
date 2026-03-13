namespace FYP_Project_II.Models
{
    public class SOSLog
    {
        public string SOSLogId { get; set; } = string.Empty;
        public string SOSRequestId { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string PerformedBy { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }
}
