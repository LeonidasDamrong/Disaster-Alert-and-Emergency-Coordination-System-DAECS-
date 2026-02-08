using FYP_Project_II.Models;

namespace FYP_Project_II.Data.Seeders
{
    public static class ShelterSeeder
    {
        public static async Task SeedSheltersAsync(ApplicationDbContext dbContext)
        {
            var baseDate = new DateTime(2024, 1, 15, 8, 0, 0, DateTimeKind.Utc);

            // Seed Shelters
            if (!dbContext.Shelters.Any())
            {
                var shelters = new[]
                {
                    new Shelter { ShelterId = "SHEL001", ShelterName = "Dewan Serbaguna Ampang", Address = "Ampang, Selangor", TotalCapacity = 500, AvailableCapacity = 495, Status = "Open", ManagedBy = "shelter001", RegisteredAt = baseDate, LastModifiedAt = baseDate },
                    new Shelter { ShelterId = "SHEL002", ShelterName = "SK Bukit Indah", Address = "Ampang, Selangor", TotalCapacity = 300, AvailableCapacity = 298, Status = "Open", ManagedBy = "shelter002", RegisteredAt = baseDate, LastModifiedAt = baseDate },
                    new Shelter { ShelterId = "SHEL003", ShelterName = "Masjid Jamek KL", Address = "Kuala Lumpur", TotalCapacity = 200, AvailableCapacity = 200, Status = "Closed", ManagedBy = "shelter003", RegisteredAt = baseDate, LastModifiedAt = baseDate }
                };
                await dbContext.Shelters.AddRangeAsync(shelters);
                Console.WriteLine("Seeded Shelters");
            }

            // Seed Evacuees (linked to shelters)
            if (!dbContext.Evacuees.Any())
            {
                var evacuees = new[]
                {
                    new Evacuee { EvacueeId = "EV001", ShelterId = "SHEL001", EvacueeName = "Aminah binti Ismail", EvacueeIdNumber = "780101-14-5123", EvacueeGender = "Female", EvacueeAge = 45, EvacueePhone = "+60123333444", EvacueeMedicalNeeds = "Diabetes medication", EvacueeCheckInDate = baseDate.AddHours(2), EvacueeCheckOutDate = null },
                    new Evacuee { EvacueeId = "EV002", ShelterId = "SHEL001", EvacueeName = "Ibrahim bin Ahmad", EvacueeIdNumber = "570615-10-8834", EvacueeGender = "Male", EvacueeAge = 67, EvacueePhone = "+60123333445", EvacueeMedicalNeeds = "High blood pressure", EvacueeCheckInDate = baseDate.AddHours(3), EvacueeCheckOutDate = null },
                    new Evacuee { EvacueeId = "EV003", ShelterId = "SHEL001", EvacueeName = "Fatimah binti Hassan", EvacueeIdNumber = "900322-08-2341", EvacueeGender = "Female", EvacueeAge = 34, EvacueePhone = "+60123333446", EvacueeMedicalNeeds = null, EvacueeCheckInDate = baseDate.AddHours(4), EvacueeCheckOutDate = null },
                    new Evacuee { EvacueeId = "EV004", ShelterId = "SHEL001", EvacueeName = "Mohammad bin Yusuf", EvacueeIdNumber = "850712-11-5567", EvacueeGender = "Male", EvacueeAge = 39, EvacueePhone = "+60123333447", EvacueeMedicalNeeds = null, EvacueeCheckInDate = baseDate.AddHours(5), EvacueeCheckOutDate = null },
                    new Evacuee { EvacueeId = "EV005", ShelterId = "SHEL001", EvacueeName = "Siti Nora binti Kamal", EvacueeIdNumber = "920415-12-7789", EvacueeGender = "Female", EvacueeAge = 32, EvacueePhone = "+60123333448", EvacueeMedicalNeeds = "Asthma", EvacueeCheckInDate = baseDate.AddHours(6), EvacueeCheckOutDate = null },
                    new Evacuee { EvacueeId = "EV006", ShelterId = "SHEL002", EvacueeName = "Lee Wei Ming", EvacueeIdNumber = "880919-06-3345", EvacueeGender = "Male", EvacueeAge = 36, EvacueePhone = "+60124444555", EvacueeMedicalNeeds = null, EvacueeCheckInDate = baseDate.AddHours(1), EvacueeCheckOutDate = null },
                    new Evacuee { EvacueeId = "EV007", ShelterId = "SHEL002", EvacueeName = "Tan Mei Ling", EvacueeIdNumber = "910203-14-6678", EvacueeGender = "Female", EvacueeAge = 33, EvacueePhone = "+60124444556", EvacueeMedicalNeeds = null, EvacueeCheckInDate = baseDate.AddHours(2), EvacueeCheckOutDate = null },
                };
                await dbContext.Evacuees.AddRangeAsync(evacuees);
                Console.WriteLine("Seeded Evacuees");
            }

            // Seed Shelter Resources (linked to shelters)
            if (!dbContext.ShelterResources.Any())
            {
                var shelterResources = new[]
                {
                    new ShelterResource { ShelterResourceId = "SR001", ShelterId = "SHEL001", ResourceType = "Food", Quantity = 500, CreatedAt = baseDate, UpdatedAt = baseDate },
                    new ShelterResource { ShelterResourceId = "SR002", ShelterId = "SHEL001", ResourceType = "Medical Supplies", Quantity = 50, CreatedAt = baseDate, UpdatedAt = baseDate },
                    new ShelterResource { ShelterResourceId = "SR003", ShelterId = "SHEL001", ResourceType = "Blankets", Quantity = 200, CreatedAt = baseDate, UpdatedAt = baseDate },
                    new ShelterResource { ShelterResourceId = "SR004", ShelterId = "SHEL001", ResourceType = "Water", Quantity = 1000, CreatedAt = baseDate, UpdatedAt = baseDate },
                    new ShelterResource { ShelterResourceId = "SR005", ShelterId = "SHEL002", ResourceType = "Food", Quantity = 300, CreatedAt = baseDate, UpdatedAt = baseDate },
                    new ShelterResource { ShelterResourceId = "SR006", ShelterId = "SHEL002", ResourceType = "Water", Quantity = 500, CreatedAt = baseDate, UpdatedAt = baseDate },
                    new ShelterResource { ShelterResourceId = "SR007", ShelterId = "SHEL002", ResourceType = "Hygiene Kits", Quantity = 100, CreatedAt = baseDate, UpdatedAt = baseDate },
                    new ShelterResource { ShelterResourceId = "SR008", ShelterId = "SHEL003", ResourceType = "Food", Quantity = 150, CreatedAt = baseDate, UpdatedAt = baseDate },
                    new ShelterResource { ShelterResourceId = "SR009", ShelterId = "SHEL003", ResourceType = "Water", Quantity = 200, CreatedAt = baseDate, UpdatedAt = baseDate }
                };
                await dbContext.ShelterResources.AddRangeAsync(shelterResources);
                Console.WriteLine("Seeded Shelter Resources");
            }
        }
    }
}
