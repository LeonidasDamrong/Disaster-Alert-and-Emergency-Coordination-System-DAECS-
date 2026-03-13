namespace FYP_Project_II.Models
{
    /// <summary>
    /// Represents a geographic zone marked as dangerous on the SOS map.
    /// Used to display colored zones indicating danger levels.
    /// </summary>
    public class DangerZone
    {
        public string DangerZoneId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal CenterLatitude { get; set; }
        public decimal CenterLongitude { get; set; }
        public decimal RadiusMeters { get; set; }
        /// <summary>Low, Medium, High, Critical</summary>
        public string DangerLevel { get; set; } = string.Empty;
        public string ColorHex { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
