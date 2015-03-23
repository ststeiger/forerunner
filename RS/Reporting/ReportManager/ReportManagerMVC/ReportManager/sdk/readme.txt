ForerunnerSDK

After you have installed the ForerunnerSDK package you will need to
configure the settings. A Package Manager Console command has been
supplied to make this as easy as possible.

The new command is named Set-FRConfig and you run it one time from the
Package Manager console window. "Tools" -> "NuGet Package Manage" ->
"Package Manager Console".

You can run Set-FRConfig as follows:

Set-FRConfig -Verbose

Set-FRConfig will prompt you for any / all input it needs to configure
the Forerunner SDK in your application. If you are interested in more information
about Set-FRConfig you can get help as follows:

Set-FRConfig -?

In addition to configuring the Forerunner SDK settings you will need to edit the
following file:

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

adding these calls will enable the REST end points to execute properly. Make
sure you add these first in the file to avoid any conflicts.

Your done, enjoy!
