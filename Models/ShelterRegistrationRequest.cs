using System.ComponentModel.DataAnnotations;

namespace FYP_Project_II.Models
{
    public class ShelterRegistrationRequest
    {
        [Key]
        public string RequestId { get; set; } = string.Empty;
        public string RequestedBy { get; set; } = string.Empty; // UserId of Shelter Manager
        public string ShelterName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public int TotalCapacity { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
        public DateTime RequestedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }
        public string? ProcessedBy { get; set; }
        public string? RejectionReason { get; set; }
    }
}
