using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;

namespace SDKSamples
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{action}",
                defaults: new { id = RouteParameter.Optional }
            );

            config.Routes.MapHttpRoute(
                name: "MobilizerManagerAPI",
                routeTemplate: "api/{controller}/{action}/{id}",
                defaults: new { id = RouteParameter.Optional },
                constraints: new { controller = @"ReportManager"  }
            );

            config.Routes.MapHttpRoute(
                name: "MobilizerViewerAPI",
                routeTemplate: "api/{controller}/{action}/{id}",
                defaults: new { id = RouteParameter.Optional },
                constraints: new { controller = @"ReportViewer" }
            );


        }
    }
}
