namespace FYP_Project_II.Models
{
    public class ResourceUsageReport
    {
        public string ReportId { get; set; } = string.Empty;
        public string WarehouseId { get; set; } = string.Empty;
        public string WarehouseName { get; set; } = string.Empty;
        public string ResourceItemId { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string Unit { get; set; } = "units";
        public string Status { get; set; } = string.Empty;
        public int RequestsCount { get; set; }
        public int DeliveredCount { get; set; }
        public DateTime GeneratedAt { get; set; }
    }
}
