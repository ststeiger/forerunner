using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;
using System.IO;

namespace ForerunnerSW
{
    // Note: For instructions on enabling IIS6 or IIS7 classic mode, 
    // visit http://go.microsoft.com/?LinkId=9394801

    public class MvcApplication : System.Web.HttpApplication
    {
        static string[][] redirects = null;

        protected void Application_Start()
        {
            AreaRegistration.RegisterAllAreas();

            WebApiConfig.Register(GlobalConfiguration.Configuration);
            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
            RouteConfig.RegisterRoutes(RouteTable.Routes);
            BundleConfig.RegisterBundles(BundleTable.Bundles);


            //watch the setting file.
            string redirFile = Server.MapPath("~") + "/Content/redirect.txt";

            if (File.Exists(redirFile))
            {
                FileSystemWatcher watcher = new FileSystemWatcher();

                watcher.Path = Path.GetDirectoryName(redirFile);
                watcher.Filter = Path.GetFileName(redirFile);

                watcher.Created += new FileSystemEventHandler(RedirChange);
                watcher.Changed += new FileSystemEventHandler(RedirChange);

                //begin watching.
                watcher.EnableRaisingEvents = true;
            }

        }

        public void RedirChange(object sender, FileSystemEventArgs e)
        {
            redirects = null;

        }
        protected void Application_BeginRequest()
        {

            if (redirects == null)
            {
                string[] tmp = System.IO.File.ReadAllLines(Server.MapPath("~") + "/Content/redirect.txt");
                redirects = new string[tmp.Length][];

                for (int i = 0;i<tmp.Length;i++)
                {
                     redirects[i]= tmp[i].Split(new string[] { "," },StringSplitOptions.None);                    
                }
            }

 
            foreach (string[] r in redirects)
            {
                if (r[0] !="" && Request.Url.AbsoluteUri.EndsWith(r[0], StringComparison.CurrentCultureIgnoreCase))
                {
                  
                    string redirect = "https://";
                    if (Request.Url.AbsoluteUri.IndexOf("localhost") >= 0)
                        redirect = "http://";

                    redirect += Request.Url.Host + ":";
                    if (Request.Url.Port != 80)
                        redirect += Request.Url.Port + r[1];

                    redirect += r[1];
                    Response.Redirect(redirect);
                    this.CompleteRequest();
                    return;
                }
            }

            if (Request.Url.AbsoluteUri.IndexOf("/Sample", StringComparison.CurrentCultureIgnoreCase) > 0)
            {
                if (Request.IsSecureConnection)
                    Response.Redirect(Request.Url.AbsoluteUri.Replace("https://", "http://"));
            }
            else if (!Request.IsSecureConnection &&
                     Request.Url.AbsoluteUri.IndexOf("localhost") < 0 &&
                     Request.Url.AbsoluteUri.IndexOf("192.168.1.111") < 0)
                Response.Redirect(Request.Url.AbsoluteUri.Replace("http://", "https://"));
            
           
            
        }
    }


}