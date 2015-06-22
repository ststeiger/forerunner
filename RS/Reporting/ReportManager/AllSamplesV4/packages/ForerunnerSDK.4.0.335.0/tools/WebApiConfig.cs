using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;

namespace GettingStartedV4
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            // Set-FRConfig, Automatic edit start: WebApiConfig.cs, Register()
            // Keep the comment above and Set-FRConfig will not change this edit again
            config.Routes.MapHttpRoute(
                name: "MobilizerManagerAPI",
                routeTemplate: "api/{controller}/{action}/{id}",
                defaults: new { id = RouteParameter.Optional },
                constraints: new { controller = "ReportManager" }
            );

            config.Routes.MapHttpRoute(
                name: "MobilizerViewerAPI",
                routeTemplate: "api/{controller}/{action}/{id}",
                defaults: new { id = RouteParameter.Optional },
                constraints: new { controller = "ReportViewer" }
            );
            // Set-FRConfig, Automatic edit end: WebApiConfig.cs, Register()

            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{id}",
                defaults: new { id = RouteParameter.Optional }
            );
        }
    }
}
