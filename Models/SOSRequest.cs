using System.ComponentModel.DataAnnotations.Schema;

namespace FYP_Project_II.Models
{
    public class SOSRequest
    {
        public string SOSRequestId { get; set; }
        public string UserId { get; set; } // Mobile user identifier
        public string VictimName { get; set; }
        public string VictimContact { get; set; }
        public string Location { get; set; }
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public string? Description { get; set; }
        public string UrgencyLevel { get; set; }
        [Column("Status")]
        public string SOSStatus { get; set; }
        public string? AssignedResponderId { get; set; }
        public string? SolvedBy { get; set; }
        public string? CompletionProofImageUrl { get; set; }
        public DateTime? CompletionProofUploadedAt { get; set; }
        public string? CompletionProofUploadedBy { get; set; }
        public DateTime RequestedAt { get; set; }
        public DateTime? SolvedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
