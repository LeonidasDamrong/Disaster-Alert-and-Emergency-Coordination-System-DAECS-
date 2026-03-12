namespace FYP_Project_II.Models
{
    public class Shelter
    {
        public string ShelterId { get; set; } = string.Empty;
        public string ShelterName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int TotalCapacity { get; set; }
        public int AvailableCapacity { get; set; }
        public string Status { get; set; } = "Open"; // Open, Full, Closed
        public string? ManagedBy { get; set; }
        public DateTime RegisteredAt { get; set; }
        public DateTime LastModifiedAt { get; set; }
        
        // Navigation properties
        public ICollection<ShelterResource> ShelterResources { get; set; } = new List<ShelterResource>();
        public ICollection<Evacuee> Evacuees { get; set; } = new List<Evacuee>();
    }
}
