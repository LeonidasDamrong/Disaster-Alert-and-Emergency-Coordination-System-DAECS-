namespace FYP_Project_II.Models
{
    public class SOSLog
    {
        public string SOSLogId { get; set; }
        public string SOSRequestId { get; set; }
        public string Details { get; set; }
        public string Action { get; set; }
        public string PerformedBy { get; set; }
        public DateTime Timestamp { get; set; }
    }
}
