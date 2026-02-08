namespace FYP_Project_II.Models
{
    public class ResourceItem
    {
        public string ResourceItemId { get; set; } = string.Empty;
        public string WarehouseId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Unit { get; set; } = "units";
        public int Quantity { get; set; }
        public string Status { get; set; } = "Available";  // Available, Critical, Reserved
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
