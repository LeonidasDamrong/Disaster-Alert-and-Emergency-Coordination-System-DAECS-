namespace FYP_Project_II.Models
{
    public class ShelterResource
    {
        public string ShelterResourceId { get; set; } = string.Empty;
        public string ShelterId { get; set; } = string.Empty;
        public string? ResourceItemId { get; set; }
        public string ResourceType { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
