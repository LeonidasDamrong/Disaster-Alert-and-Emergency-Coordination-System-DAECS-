namespace FYP_Project_II.Models
{
    /// <summary>
    /// Community / victim-submitted incident report pending admin approval before broadcast as an <see cref="Alert"/>.
    /// </summary>
    public class VictimReport
    {
        public string VictimReportId { get; set; } = string.Empty;

        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;

        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }

        public string LocationName { get; set; } = string.Empty;
        public string SafetyInfo { get; set; } = string.Empty;
        public string Source { get; set; } = "Community";

        public string ReporterEmail { get; set; } = string.Empty;
        public string ReporterName { get; set; } = string.Empty;

        public bool HasEvidence { get; set; }
        public string? ImageUrl { get; set; }

        /// <summary>Pending, Approved, Rejected</summary>
        public string Status { get; set; } = "Pending";

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public DateTime? ReviewedAt { get; set; }
        public string? ReviewedBy { get; set; }
        public string? RejectionReason { get; set; }

        /// <summary>Populated when Status becomes Approved and an alert is created.</summary>
        public string? CreatedAlertId { get; set; }
    }
}
