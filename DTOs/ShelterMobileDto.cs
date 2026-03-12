namespace FYP_Project_II.DTOs
{
    public sealed class ShelterMobileDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int Capacity { get; set; }
        public int CurrentOccupancy { get; set; }
        public string Status { get; set; } = "Open";
    }
}

