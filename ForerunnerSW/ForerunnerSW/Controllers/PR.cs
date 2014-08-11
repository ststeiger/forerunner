using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.IO;
using System.Web.Script.Serialization;

namespace ForerunnerSW.Controllers
{
    public class PRController : Controller
    {
     
        class Ad
        {
            public string ID;
            public string Header;
            public string SubHeader;
        }

        static Ad[] adCopy = null;
        static FileSystemWatcher watcher = null;

        public void fileChange(object sender, FileSystemEventArgs e)
        {
            adCopy = null;

        }


        public void SettAd(string ID)
        {

            if (watcher == null)
            {
                 //watch the setting file.
                string adFile = Server.MapPath("~") + "/Content/adCopy.txt";

                if (System.IO.File.Exists(adFile))
                {
                    watcher = new FileSystemWatcher();

                    watcher.Path = Path.GetDirectoryName(adFile);
                    watcher.Filter = Path.GetFileName(adFile);

                    watcher.Created += new FileSystemEventHandler(fileChange);
                    watcher.Changed += new FileSystemEventHandler(fileChange);

                    //begin watching.
                    watcher.EnableRaisingEvents = true;
                }
            }

            if (adCopy == null)
            {               
                JavaScriptSerializer ads = new JavaScriptSerializer();
                adCopy = ads.Deserialize<Ad[]>(System.IO.File.ReadAllText(Server.MapPath("~") + "/Content/adCopy.txt"));
            }

            foreach (Ad pr in adCopy)
            {
                if (pr.ID == ID)
                {
                    ViewData["Header"] = pr.Header;
                    ViewData["SubHeader"] = pr.SubHeader;
                    return;
                }
            }

        }


        public ActionResult Dev(string adID = "dev-general")
        {
            SettAd(adID);
            return View();
        }
        public ActionResult Mobilizer(string adID = "mob-general")
        {
            SettAd(adID);
            return View();
        }
      
      
    }
}
