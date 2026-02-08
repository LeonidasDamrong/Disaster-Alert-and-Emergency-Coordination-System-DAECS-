namespace FYP_Project_II.Models
{
    public class Shelter
    {
        public string ShelterId { get; set; } = string.Empty;
        public string ShelterName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public int TotalCapacity { get; set; }
        public int AvailableCapacity { get; set; }
        public string Status { get; set; } = "Open"; // Open, Full, Closed
        public string? ManagedBy { get; set; }
        public DateTime RegisteredAt { get; set; }
        public DateTime LastModifiedAt { get; set; }
    }
}
