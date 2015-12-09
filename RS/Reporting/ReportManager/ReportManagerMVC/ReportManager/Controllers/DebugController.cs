using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Forerunner.SSRS.Viewer;
using Forerunner;
using System.IO;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace ReportManager.Controllers
{
    [Authorize]
    public class DebugController : Controller
    {
        //
        // GET: /

        public ActionResult Index()
        {
            return View();
        }
        public ActionResult Test()
        {
            return View();
        }
        public ActionResult DynamicReport()
        {
            ReportViewer rv = ForerunnerUtil.GetReportViewerInstance(null, "http://localhost:8080/reportserver",100000,null);
            string RDL = System.IO.File.ReadAllText(Server.MapPath("~/Product Line Sales 2008.rdl"));

            string result = rv.LoadReportDefinition(RDL);

            JObject o = JObject.Parse(result);
            ViewData.Add("SessionID", (string)o["SessionID"]);
            return View();
        }
        public ActionResult CascadeTest()
        {
            return View();
        }
    }
}
