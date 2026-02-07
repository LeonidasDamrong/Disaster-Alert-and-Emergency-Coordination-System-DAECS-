using Microsoft.AspNetCore.Mvc;

namespace FYP_Project_II.Controllers
{
    public class ResourceController : Controller
    {
        // GET: ResourceController
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult SubmitResourceRequest(string resourceRequest)
        {
            Console.WriteLine($"Resource request submitted: {resourceRequest}");
            return View();
        }

    }
}
