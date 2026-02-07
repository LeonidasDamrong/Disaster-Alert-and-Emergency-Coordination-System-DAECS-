namespace FYP_Project_II.Models
{
    public class ShelterResource
    {
        public string ShelterResourceId { get; set; }
        public string ShelterId { get; set; }
        public string ResourceItemId { get; set; }
        public int Quantity { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
