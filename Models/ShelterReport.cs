namespace FYP_Project_II.Models
{
    public class ShelterReport
    {
        public string ShelterReportId { get; set; }
        public string ShelterId { get; set; }
        public string Name { get; set; }
        public string Location { get; set; }
        public int Capacity { get; set; }
        public int AvailableCapacity { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
