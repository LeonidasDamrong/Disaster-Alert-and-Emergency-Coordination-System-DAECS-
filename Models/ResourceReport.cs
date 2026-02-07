namespace FYP_Project_II.Models
{
    public class ResourceReport
    {
        public string ResourceReportId { get; set; }
        public string ResourceItemId { get; set; }
        public string Name { get; set; }
        public string Type { get; set; }
        public int Quantity { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
