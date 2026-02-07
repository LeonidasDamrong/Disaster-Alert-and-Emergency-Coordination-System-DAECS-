namespace FYP_Project_II.Models
{
    public class SOSRequest
    {
        public string SOSRequestId { get; set; }
        public string UserId { get; set; }
        public string Location { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
