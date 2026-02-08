using System.ComponentModel.DataAnnotations;

namespace FYP_Project_II.Models
{
    public class Warehouse
    {
        [Key]
        public string WarehouseId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? ManagedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
