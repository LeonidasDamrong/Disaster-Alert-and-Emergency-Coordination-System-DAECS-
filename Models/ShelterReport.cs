namespace FYP_Project_II.Models
{
    public class ShelterReport
    {
        public string ShelterReportId { get; set; } = string.Empty;
        public string ShelterId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public int TotalCapacity { get; set; }
        public int AvailableCapacity { get; set; }
        public string Status { get; set; } = string.Empty;
        public string ResourceSummary { get; set; } = string.Empty; // JSON or comma-separated summary
        public DateTime GeneratedAt { get; set; }
    }
}
