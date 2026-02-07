namespace FYP_Project_II.Models
{
    /// <summary>
    /// ShelterManager class - manages emergency shelters and evacuees
    /// </summary>
    public class ShelterManager : User
    {
        // Additional properties specific to ShelterManager
        // public string ShelterId { get; set; }
        // public string ShelterLocation { get; set; }
        // public int CurrentCapacity { get; set; }
        // public int MaxCapacity { get; set; }
        // public List<string> Evacuees { get; set; }

        // Constructor
        public ShelterManager() : base()
        {
            Role = "ShelterManager";
            // ShelterId = string.Empty;
            // ShelterLocation = string.Empty;
            // CurrentCapacity = 0;
            // MaxCapacity = 0;
            // Evacuees = new List<string>();
        }

        // Parameterized constructor
        public ShelterManager(string userId, string username, string password, string phoneNo, string email, string shelterId, string shelterLocation, int maxCapacity)
            : base(userId, username, password, phoneNo, email, "ShelterManager")
        {
            // ShelterId = shelterId;
            // ShelterLocation = shelterLocation;
            // MaxCapacity = maxCapacity;
            // CurrentCapacity = 0;
            // Evacuees = new List<string>();
        }

        // ShelterManager-specific methods
        // public bool RegisterEvacuee(string evacueeId)
        // {
        //     // TODO: Implement evacuee registration logic
        //     if (CurrentCapacity < MaxCapacity)
        //     {
        //         Evacuees.Add(evacueeId);
        //         CurrentCapacity++;
        //         Console.WriteLine($"Evacuee {evacueeId} registered. Current capacity: {CurrentCapacity}/{MaxCapacity}");
        //         return true;
        //     }
        //     Console.WriteLine("Shelter is at full capacity");
        //     return false;
        // }

        // public void CheckOutEvacuee(string evacueeId)
        // {
        //     // TODO: Implement evacuee checkout logic
        //     if (Evacuees.Remove(evacueeId))
        //     {
        //         CurrentCapacity--;
        //         Console.WriteLine($"Evacuee {evacueeId} checked out. Current capacity: {CurrentCapacity}/{MaxCapacity}");
        //     }
        // }

        // public void RequestSupplies(string supplyType, int quantity)
        // {
        //     // TODO: Implement supply request logic
        //     Console.WriteLine($"Requesting {quantity} units of {supplyType}");
        // }

        // public void UpdateShelterStatus(string status)
        // {
        //     // TODO: Implement shelter status update logic
        //     Console.WriteLine($"Shelter {ShelterId} status updated to: {status}");
        // }

        // public int GetAvailableCapacity()
        // {
        //     return MaxCapacity - CurrentCapacity;
        // }
    }
}
