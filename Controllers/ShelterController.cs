using Microsoft.AspNetCore.Mvc;

namespace FYP_Project_II.Controllers
{
    public class ShelterController : Controller
    {
        // GET: ShelterController
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult RegisterShelter(string shelter)
        {
            Console.WriteLine($"Shelter registered: {shelter}");
            return View();
        }

        public ActionResult UpdateShelterDetails(string shelter)
        {
            Console.WriteLine($"Shelter updated: {shelter}");
            return View();
        }

        public ActionResult DeleteShelter(string shelter)
        {
            Console.WriteLine($"Shelter deleted: {shelter}");
            return View();
        }

        public ActionResult ViewAllShelters()
        {
            Console.WriteLine($"All shelters viewed");
            return View();
        }

    }
}
