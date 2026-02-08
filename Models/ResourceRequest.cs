namespace FYP_Project_II.Models
{
    public class ResourceRequest
    {
        public string ResourceRequestId { get; set; } = string.Empty;
        public string ResourceItemId { get; set; } = string.Empty;
        public string WarehouseId { get; set; } = string.Empty;
        public string RequestedBy { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string Unit { get; set; } = "units";
        public string Destination { get; set; } = string.Empty;
        public string Urgency { get; set; } = "Medium";  // Low, Medium, High, Critical
        public string Status { get; set; } = "Pending";   // Pending, Approved, Rejected, Delivered
        public string? RejectionReason { get; set; }
        public string? AssignedDriverId { get; set; }
        public string? ProcessedBy { get; set; }
        public DateTime RequestedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
