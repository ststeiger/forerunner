using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ReportMannagerConfigTool
{
    public static class WebServerConfig
    {
        public static string ServerType
        {
            get { return ConfigToolHelper.GetAppConfig("serverType"); }
            set { ConfigToolHelper.SetAppConfig("serverType", value); }
        }

        public static string SiteName
        {
            get { return ConfigToolHelper.GetAppConfig("siteName"); }
            set { ConfigToolHelper.SetAppConfig("siteName", value); }
        }

        public static string Port
        {
            get { return ConfigToolHelper.GetAppConfig("port"); }
            set { ConfigToolHelper.SetAppConfig("port", value); }
        }
    }
}
