using System.ComponentModel.DataAnnotations;

namespace FYP_Project_II.Models
{
    public class SystemSettings
    {
        [Key]
        public int Id { get; set; }
        public string SystemName { get; set; } = "DAECS - Disaster Alert and Emergency Coordination System";
        public string OrganizationName { get; set; } = "National Disaster Management Agency";
        public string EmergencyContactNumber { get; set; } = "+60-3-8000-8000";
        public bool EnableNotifications { get; set; } = true;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
