namespace FYP_Project_II.Models
{
    /// <summary>
    /// DisasterManager class - manages disaster-related operations
    /// </summary>
    public class DisasterManager : User
    {
        // Additional properties specific to DisasterManager
        // public string AssignedRegion { get; set; }
        // public List<string> ManagedDisasters { get; set; }

        // Constructor
        public DisasterManager() : base()
        {
            Role = "DisasterManager";
            // AssignedRegion = string.Empty;
            // ManagedDisasters = new List<string>();
        }

        // Parameterized constructor
        public DisasterManager(string userId, string username, string password, string phoneNo, string email, string assignedRegion)
            : base(userId, username, password, phoneNo, email, "DisasterManager")
        {
            // AssignedRegion = assignedRegion;
            // ManagedDisasters = new List<string>();
        }

        // DisasterManager-specific methods
        public void CreateAlert(string disasterInfo)
        {
            // TODO: Implement disaster alert creation logic
            Console.WriteLine($"Disaster alert created: {disasterInfo}");
        }

        // public void AssignResponders(string disasterId, List<string> responderIds)
        // {
        //     // TODO: Implement responder assignment logic
        //     Console.WriteLine($"Assigned {responderIds.Count} responders to disaster {disasterId}");
        // }

        // public void MonitorDisasterStatus(string disasterId)
        // {
        //     // TODO: Implement disaster monitoring logic
        //     Console.WriteLine($"Monitoring disaster: {disasterId}");
        // }
    }
}
