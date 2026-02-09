namespace FYP_Project_II.Models
{
    public class CaseNote
    {
        public string CaseNoteId { get; set; }
        public string SOSRequestId { get; set; }
        public string ResponderId { get; set; }
        public string Note { get; set; }
        public DateTime Timestamp { get; set; }
    }
}
