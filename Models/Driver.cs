using System.ComponentModel.DataAnnotations;

namespace FYP_Project_II.Models
{
    public class Driver
    {
        [Key]
        public string DriverId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string VehicleInfo { get; set; } = string.Empty;
        public string Status { get; set; } = "Available"; // Available, Busy, Unavailable
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
