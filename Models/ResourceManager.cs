namespace FYP_Project_II.Models
{
    /// <summary>
    /// ResourceManager class - manages disaster relief resources and inventory
    /// </summary>
    public class ResourceManager : User
    {
        // Additional properties specific to ResourceManager
        public string WarehouseId { get; set; }
        public string WarehouseLocation { get; set; }
        public Dictionary<string, int> Inventory { get; set; }
        public List<string> PendingRequests { get; set; }

        // Constructor
        public ResourceManager() : base()
        {
            Role = "ResourceManager";
            WarehouseId = string.Empty;
            WarehouseLocation = string.Empty;
            Inventory = new Dictionary<string, int>();
            PendingRequests = new List<string>();
        }

        // Parameterized constructor
        public ResourceManager(string userId, string username, string password, string phoneNo, string email, string warehouseId, string warehouseLocation)
            : base(userId, username, password, phoneNo, email, "ResourceManager")
        {
            WarehouseId = warehouseId;
            WarehouseLocation = warehouseLocation;
            Inventory = new Dictionary<string, int>();
            PendingRequests = new List<string>();
        }

        // ResourceManager-specific methods
        public void AddResource(string resourceType, int quantity)
        {
            // TODO: Implement resource addition logic
            if (Inventory.ContainsKey(resourceType))
            {
                Inventory[resourceType] += quantity;
            }
            else
            {
                Inventory[resourceType] = quantity;
            }
            Console.WriteLine($"Added {quantity} units of {resourceType}. Total: {Inventory[resourceType]}");
        }

        public bool AllocateResource(string resourceType, int quantity, string requestId)
        {
            // TODO: Implement resource allocation logic
            if (Inventory.ContainsKey(resourceType) && Inventory[resourceType] >= quantity)
            {
                Inventory[resourceType] -= quantity;
                Console.WriteLine($"Allocated {quantity} units of {resourceType} for request {requestId}");
                return true;
            }
            Console.WriteLine($"Insufficient {resourceType}. Available: {(Inventory.ContainsKey(resourceType) ? Inventory[resourceType] : 0)}");
            return false;
        }

        public void ProcessSupplyRequest(string requestId, string resourceType, int quantity)
        {
            // TODO: Implement supply request processing logic
            PendingRequests.Add(requestId);
            Console.WriteLine($"Processing supply request {requestId} for {quantity} units of {resourceType}");
        }

        public Dictionary<string, int> GetInventoryReport()
        {
            return new Dictionary<string, int>(Inventory);
        }

        public void UpdateInventory(string resourceType, int newQuantity)
        {
            Inventory[resourceType] = newQuantity;
            Console.WriteLine($"Inventory updated: {resourceType} = {newQuantity}");
        }

        public int CheckResourceAvailability(string resourceType)
        {
            return Inventory.ContainsKey(resourceType) ? Inventory[resourceType] : 0;
        }
    }
}
