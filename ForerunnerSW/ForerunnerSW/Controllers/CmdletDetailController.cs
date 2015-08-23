using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace ForerunnerSW.Controllers
{
    public class CmdletDetailController : Controller
    {
        //
        // GET: /SampleDetail/

        public ActionResult Summary()
        {
            return View();
        }
        public ActionResult PublishForerunnerRDLExt()
        {
            return View();
        }
        public ActionResult PublishFRExtension()
        {
            return View();
        }
        public ActionResult AddFRScriptRef()
        {
            return View();
        }
        public ActionResult SetFRConfig()
        {
            return View();
        }
    }
}
