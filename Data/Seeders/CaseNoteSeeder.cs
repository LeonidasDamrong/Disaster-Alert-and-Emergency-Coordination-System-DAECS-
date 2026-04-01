using FYP_Project_II.Models;
using Microsoft.EntityFrameworkCore;

namespace FYP_Project_II.Data.Seeders
{
    public static class CaseNoteSeeder
    {
        public static async Task SeedCaseNotesAsync(ApplicationDbContext dbContext)
        {
            if (await dbContext.CaseNotes.AnyAsync()) return;

            // Only seed notes for existing SOS requests to keep workflow realistic.
            var sosIds = await dbContext.SOSRequests
                .Select(s => s.SOSRequestId)
                .ToListAsync();

            if (!sosIds.Contains("SOS002") && !sosIds.Contains("SOS003")) return;

            var baseDate = new DateTime(2024, 1, 15, 8, 0, 0, DateTimeKind.Utc);

            var notes = new List<CaseNote>();

            if (sosIds.Contains("SOS002"))
            {
                notes.AddRange(new[]
                {
                    new CaseNote
                    {
                        CaseNoteId = "NOTE001",
                        SOSRequestId = "SOS002",
                        ResponderId = "responder001",
                        Note = "Arrived at vicinity. Flood water rising; requesting barricade support.",
                        Timestamp = baseDate.AddHours(2).AddMinutes(20)
                    },
                    new CaseNote
                    {
                        CaseNoteId = "NOTE002",
                        SOSRequestId = "SOS002",
                        ResponderId = "responder001",
                        Note = "Victim contacted. Safe location confirmed. Coordinating with shelter manager for pickup.",
                        Timestamp = baseDate.AddHours(2).AddMinutes(45)
                    }
                });
            }

            if (sosIds.Contains("SOS003"))
            {
                notes.AddRange(new[]
                {
                    new CaseNote
                    {
                        CaseNoteId = "NOTE003",
                        SOSRequestId = "SOS003",
                        ResponderId = "responder001",
                        Note = "Evacuation completed. Victim moved to nearest shelter and registered.",
                        Timestamp = baseDate.AddHours(-1).AddMinutes(-15)
                    },
                    new CaseNote
                    {
                        CaseNoteId = "NOTE004",
                        SOSRequestId = "SOS003",
                        ResponderId = "responder001",
                        Note = "Completion proof uploaded. Marking case as completed.",
                        Timestamp = baseDate.AddHours(-1)
                    }
                });
            }

            if (notes.Count == 0) return;

            await dbContext.CaseNotes.AddRangeAsync(notes);
            Console.WriteLine("Seeded Case Notes");
        }
    }
}

