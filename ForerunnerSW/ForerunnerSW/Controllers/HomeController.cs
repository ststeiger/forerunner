using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace ForerunnerSW.Controllers
{
    public class HomeController : Controller
    {
        //
        // GET: /Home/

        public ActionResult Index()
        {
            return View();
        }
        public ActionResult Demo()
        {
            return View();
        }
        public ActionResult About()
        {
            return View();
        }
        public ActionResult Contact()
        {
            return View();
        }
        public ActionResult Register()
        {
            return View();
        }
        public ActionResult Thankyou()
        {
            return View();
        }
        public ActionResult PASS()
        {
            return View();
        }
        public ActionResult Support()
        {
            return Support();
        }
    }
}
