using Microsoft.AspNetCore.Mvc;

namespace FYP_Project_II.Controllers
{
    public class AlertController : Controller
    {
        // GET: AlertController
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult CreateAlert()
        {
            // Console.WriteLine($"Alert created: {alert}");
            return View();
        }

        public ActionResult ScheduleAlert()
        {
            // Console.WriteLine($"Alert scheduled: {alert}");
            return View();
        }
        
        public ActionResult UpdateScheduledAlert()
        {
            // Console.WriteLine($"Scheduled alert updated: {alert}");
            return View();
        }
        
        public ActionResult CancelScheduledAlert()
        {
            // Console.WriteLine($"Scheduled alert cancelled: {alert}");
            return View();
        }

        public ActionResult ViewAlertHistory()
        {
            // Console.WriteLine($"Alert history viewed");
            return View();
        }
    }
}
