using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.IO;
using System.Web.Script.Serialization;

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
            PressRelease[] prs;
            JavaScriptSerializer releases = new JavaScriptSerializer();

            prs = releases.Deserialize<PressRelease[]>(System.IO.File.ReadAllText(Server.MapPath("~") + "/Content/Press/PressReleases.txt"));
            string news = @"<div class='ForerunnerPressContent' style='margin-bottom:20px;'>
            <span style='font-weight:bold;'>{0}</span>
            <div class='ForerunnerPressContent'><b>{1}</b> — {2}
            <a href='{3}' target='_blank' >read more...</a></div>
        </div>";
            string allNews = "";

            foreach (PressRelease pr in prs)
            {
                allNews+=  String.Format(news, pr.Title, pr.Release, pr.Description, pr.Link);                    
               
            }
            ViewData["Press"] = allNews;
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
        public ActionResult Activation()
        {
            return View();
        }
        public ActionResult Thankyou()
        {
            return View();
        }

        class PressRelease
        {
            public string ID;
            public string Link;
            public string Title;
            public string Release;
            public string Description;
            public string Content;

        }
        public ActionResult Press(string Article)
        {
            PressRelease[] prs;
            JavaScriptSerializer releases = new JavaScriptSerializer();

            prs = releases.Deserialize<PressRelease[]>(System.IO.File.ReadAllText(Server.MapPath("~") + "/Content/Press/PressReleases.txt")) ;

            foreach (PressRelease pr in prs)
            {
                if (pr.ID == Article)
                {
                    ViewData["Title"] = pr.Title;
                    ViewData["Description"] = pr.Description;
                    ViewData["Content"] = pr.Content.Replace("\r\n","<br/>");
                    ViewData["Release"] = pr.Release;
                }
            }
            return View();
        }
        public ActionResult Support()
        {
            return View();
        }
        public ActionResult Developers()
        {
            return View();
        }
        public ActionResult Samples()
        {
            return View();
        }
        public ActionResult Pricing()
        {
            return View();
        }
        public ActionResult Features()
        {
            return View();
        }
        public ActionResult NotFound()
        {
            return View();
        }
    }
}
