namespace FYP_Project_II.Models
{
    /// <summary>
    /// FirstResponder class - represents emergency first responders
    /// </summary>
    public class FirstResponder : User
    {
        // Additional properties specific to FirstResponder
        public string Specialization { get; set; }
        public string CurrentLocation { get; set; }
        public bool IsAvailable { get; set; }
        public List<string> AssignedTasks { get; set; }

        // Constructor
        public FirstResponder() : base()
        {
            Role = "FirstResponder";
            Specialization = string.Empty;
            CurrentLocation = string.Empty;
            IsAvailable = true;
            AssignedTasks = new List<string>();
        }

        // Parameterized constructor
        public FirstResponder(string userId, string username, string password, string phoneNo, string email, string specialization)
            : base(userId, username, password, phoneNo, email, "FirstResponder")
        {
            Specialization = specialization;
            CurrentLocation = string.Empty;
            IsAvailable = true;
            AssignedTasks = new List<string>();
        }

        // FirstResponder-specific methods
        public void AcceptTask(string taskId)
        {
            // TODO: Implement task acceptance logic
            AssignedTasks.Add(taskId);
            IsAvailable = false;
            Console.WriteLine($"Task {taskId} accepted by {Username}");
        }

        public void UpdateLocation(string location)
        {
            CurrentLocation = location;
            Console.WriteLine($"Location updated to: {location}");
        }

        public void CompleteTask(string taskId)
        {
            // TODO: Implement task completion logic
            AssignedTasks.Remove(taskId);
            if (AssignedTasks.Count == 0)
            {
                IsAvailable = true;
            }
            Console.WriteLine($"Task {taskId} completed");
        }

        public void ReportIncident(string incidentDetails)
        {
            // TODO: Implement incident reporting logic
            Console.WriteLine($"Incident reported: {incidentDetails}");
        }
    }
}
