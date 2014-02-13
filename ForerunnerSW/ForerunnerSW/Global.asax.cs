using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;

namespace ForerunnerSW
{
    // Note: For instructions on enabling IIS6 or IIS7 classic mode, 
    // visit http://go.microsoft.com/?LinkId=9394801

    public class MvcApplication : System.Web.HttpApplication
    {
        protected void Application_Start()
        {
            AreaRegistration.RegisterAllAreas();

            WebApiConfig.Register(GlobalConfiguration.Configuration);
            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
            RouteConfig.RegisterRoutes(RouteTable.Routes);
            BundleConfig.RegisterBundles(BundleTable.Bundles);
        }
        protected void Application_BeginRequest()
        {

            if (Request.Url.AbsoluteUri.IndexOf("/Sample", StringComparison.CurrentCultureIgnoreCase) > 0)
            {
                if (Request.IsSecureConnection)
                    Response.Redirect(Request.Url.AbsoluteUri.Replace("https://", "http://"));
            }
            else if (!Request.IsSecureConnection && Request.Url.AbsoluteUri.IndexOf("localhost") < 0)
                Response.Redirect(Request.Url.AbsoluteUri.Replace("http://", "https://"));
            
           
            
        }
    }


}