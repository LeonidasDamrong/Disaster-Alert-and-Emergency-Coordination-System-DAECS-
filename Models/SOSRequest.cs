using System.ComponentModel.DataAnnotations.Schema;

namespace FYP_Project_II.Models
{
    public class SOSRequest
    {
        public string SOSRequestId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty; // Mobile user identifier
        public string TrackingToken { get; set; } = string.Empty; // Victim subscription token (mobile)
        public string VictimName { get; set; } = string.Empty;
        public string VictimContact { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public string? Description { get; set; }
        public string UrgencyLevel { get; set; } = string.Empty;
        [Column("Status")]
        public string SOSStatus { get; set; } = string.Empty;
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
