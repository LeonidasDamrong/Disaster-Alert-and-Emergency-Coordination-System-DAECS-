using FYP_Project_II.Data.Seeders;
using FYP_Project_II.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FYP_Project_II.Data
{
    public static class DbInitializer
    {
        public static async Task SeedUsersAsync(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            ApplicationDbContext dbContext)
        {
            await UserSeeder.SeedUsersAndRolesAsync(userManager, roleManager);
            await SeedDummyDataAsync(dbContext);
        }

        private static async Task SeedDummyDataAsync(ApplicationDbContext dbContext)
        {
            await SystemSeeder.SeedSystemDataAsync(dbContext);
            await ShelterSeeder.SeedSheltersAsync(dbContext);
            await WarehouseSeeder.SeedWarehousesAsync(dbContext);
            await DriverSeeder.SeedDriversAsync(dbContext);
            await ResourceSeeder.SeedResourcesAsync(dbContext);
            // ResourceRequestSeeder queries the database for Resources; ensure they are saved first.
            await dbContext.SaveChangesAsync();
            await ResourceRequestSeeder.SeedResourceRequestsAsync(dbContext);
            await CommunicationSeeder.SeedCommunicationDataAsync(dbContext);
            // CaseNoteSeeder queries the database for SOS requests; ensure they're saved first.
            await dbContext.SaveChangesAsync();
            await CaseNoteSeeder.SeedCaseNotesAsync(dbContext);
            await DangerZoneSeeder.SeedDangerZonesAsync(dbContext);

            await dbContext.SaveChangesAsync();
        }
    }
}
