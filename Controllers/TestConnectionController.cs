using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYP_Project_II.Data;

namespace FYP_Project_II.Controllers
{
    public class TestConnectionController : Controller
    {
        private readonly ApplicationDbContext _context;

        public TestConnectionController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            try
            {
                // Test connection
                var canConnect = await _context.Database.CanConnectAsync();

                if (canConnect)
                {
                    ViewBag.Status = "success";
                    ViewBag.Message = "Successfully connected to Azure SQL Database!";
                    ViewBag.Server = _context.Database.GetDbConnection().DataSource;
                    ViewBag.Database = _context.Database.GetDbConnection().Database;

                    // Get user count
                    var userCount = await _context.Users.CountAsync();
                    ViewBag.UserCount = userCount;

                    // Get table list
                    var tables = await _context.Database.SqlQueryRaw<string>(
                        "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'"
                    ).ToListAsync();
                    ViewBag.Tables = tables;
                }
                else
                {
                    ViewBag.Status = "error";
                    ViewBag.Message = "Cannot connect to database";
                }
            }
            catch (Exception ex)
            {
                ViewBag.Status = "error";
                ViewBag.Message = $"Connection Error: {ex.Message}";
                ViewBag.InnerException = ex.InnerException?.Message;
            }

            return View();
        }
    }
}