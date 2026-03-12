using FYP_Project_II.Data;
using FYP_Project_II.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FYP_Project_II.Controllers
{
    [Route("api/mobile/shelters")]
    [ApiController]
    public class MobileSheltersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MobileSheltersController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Mobile-friendly shelter list for map display.
        /// </summary>
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<ShelterMobileDto>>> GetShelters()
        {
            var shelters = await _context.Shelters
                .AsNoTracking()
                .OrderBy(s => s.ShelterName)
                .Select(s => new ShelterMobileDto
                {
                    Id = s.ShelterId,
                    Name = s.ShelterName,
                    Address = s.Address,
                    Latitude = s.Latitude,
                    Longitude = s.Longitude,
                    Capacity = s.TotalCapacity,
                    CurrentOccupancy = s.TotalCapacity - s.AvailableCapacity,
                    Status = s.Status
                })
                .ToListAsync();

            return Ok(shelters);
        }
    }
}

