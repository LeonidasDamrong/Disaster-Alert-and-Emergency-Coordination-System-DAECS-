namespace FYP_Project_II.Models
{
    public class CaseNote
    {
        public string CaseNoteId { get; set; } = string.Empty;
        public string SOSRequestId { get; set; } = string.Empty;
        public string ResponderId { get; set; } = string.Empty;
        public string Note { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }
}
