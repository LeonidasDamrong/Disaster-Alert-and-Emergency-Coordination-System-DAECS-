namespace FYP_Project_II.Models
{
    public class Evacuee
    {
        public string EvacueeId { get; set; } = string.Empty;
        public string ShelterId { get; set; } = string.Empty;
        public string EvacueeName { get; set; } = string.Empty;
        public string? EvacueeIdNumber { get; set; }
        public string EvacueeGender { get; set; } = string.Empty;
        public int EvacueeAge { get; set; }
        public string? EvacueePhone { get; set; }
        public string? EvacueeMedicalNeeds { get; set; }
        public DateTime EvacueeCheckInDate { get; set; }
        public DateTime? EvacueeCheckOutDate { get; set; } // null = still checked in
    }
}
