﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

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
        public ActionResult CascadeTest()
        {
            return View();
        }
    }
}
