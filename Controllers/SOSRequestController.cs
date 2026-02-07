using Microsoft.AspNetCore.Mvc;

namespace MyApp.Namespace
{
    public class SOSRequestController : Controller
    {
        // GET: SOSRequestController
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult ViewSOSRequests()
        {
            Console.WriteLine($"SOS requests viewed");
            return View();
        }

        public ActionResult UpdateSOSUrgencyLevel(string sosId, string urgencyLevel)
        {
            Console.WriteLine($"SOS urgency level updated: {sosId} - {urgencyLevel}");
            return View();
        }

        public ActionResult ViewSOSLogs()
        {
            Console.WriteLine($"SOS logs viewed");
            return View();
        }

    }
}
