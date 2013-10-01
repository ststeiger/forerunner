using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace ReportManager.Controllers
{
    [Authorize]
    public class HomeController : Controller
    {
        //
        // GET: /

        public ActionResult Index()
        {
            return View();
        }

    }
}
