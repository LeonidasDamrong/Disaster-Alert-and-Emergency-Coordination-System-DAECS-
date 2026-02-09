namespace FYP_Project_II.Models
{
    /// <summary>
    /// Represents a geographic zone marked as dangerous on the SOS map.
    /// Used to display colored zones indicating danger levels.
    /// </summary>
    public class DangerZone
    {
        public string DangerZoneId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public decimal CenterLatitude { get; set; }
        public decimal CenterLongitude { get; set; }
        public decimal RadiusMeters { get; set; }
        /// <summary>Low, Medium, High, Critical</summary>
        public string DangerLevel { get; set; }
        public string ColorHex { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
