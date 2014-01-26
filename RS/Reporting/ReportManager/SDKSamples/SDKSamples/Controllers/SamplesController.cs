using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SDKSamples.Controllers
{
    public class SamplesController : Controller
    {
        //
        // GET: /Samples/

        public ActionResult Index()
        {
            return View();
        }

        public ActionResult ReportViewerEZ()
        {
            return View();
        }

    }
}
