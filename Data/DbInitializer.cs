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
            await ResourceSeeder.SeedResourcesAsync(dbContext);
            await CommunicationSeeder.SeedCommunicationDataAsync(dbContext);
            
            await dbContext.SaveChangesAsync();
        }
    }
}
