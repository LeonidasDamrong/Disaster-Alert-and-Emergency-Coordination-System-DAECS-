using Microsoft.AspNetCore.Mvc;

namespace FYP_Project_II.Controllers
{
    public class AnnouncementController : Controller
    {
        // GET: AnnouncementController
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult CreateAnnouncement(string announcement)
        {
            Console.WriteLine($"Announcement created: {announcement}");
            return View();
        }

        public ActionResult DeleteAnnouncement(string announcement)
        {
            Console.WriteLine($"Announcement deleted: {announcement}");
            return View();
        }

    }
}
