using System.ComponentModel.DataAnnotations;

namespace FYP_Project_II.Models
{
    public class ResourceStockLog
    {
        [Key]
        public string ResourceStockLogId { get; set; } = string.Empty;
        public string ResourceItemId { get; set; } = string.Empty;
        public string WarehouseId { get; set; } = string.Empty;
        public int QuantityAdded { get; set; }
        public string Source { get; set; } = string.Empty;  // Source of stock (donation, purchase, etc.)
        public string LoggedBy { get; set; } = string.Empty;
        public DateTime LoggedAt { get; set; }
    }
}
