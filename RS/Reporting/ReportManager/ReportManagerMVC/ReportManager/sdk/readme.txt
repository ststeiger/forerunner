ForerunnerSDK

After you have installed the ForerunnerSDK package you will need to
edit a small number of files to finish enabling support for the SDK
as follows:

File: ~\web.config

In the web.config file you will need to add to the <appSettings> section
which is a child of the <configuration> section. Specifically you will need
to add all of the forerunner specific settings. These settings are easy to
identify because they all start as follows:

    <add key="Forerunner...

The best way to add the correct values to your web application is to copy
all the forerunner specific settings from a properly configured Mobilizer
installation.

If you don't already have Mobilizer installed you can register for a free
trial license here:

https://www.forerunnersw.com/registerTrial

Once you have a properly configured and running Mobilizer for your machine,
Simply copy the forerunner specific <appSettings>.

File: ~\App_Start\WebApiConfig.cs

The Forerunner SDK comes with System.Web.Http.ApiController classes. These
are contained in the sdk folder. In order for these to run properly the method

    Register(HttpConfiguration config)

must contain the supporting MapHttpRoute() calls as follows:

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

adding these calls will enable the REST end point to execute properly. Make
sure you add these first in the file to avoid any conflicts.
    