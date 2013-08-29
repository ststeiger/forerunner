using System;
using System.Configuration;
using System.Collections.Generic;
using System.Net;
using System.Xml;
using Microsoft.Web.Administration;
using UWS.Configuration;
using UWS.Framework;

namespace ReportMannagerConfigTool
{
    public static class ReportManagerConfig
    {
        private static string forerunnerPoolName = ConfigurationManager.AppSettings["ForerunnerPool"];
        private static string defaultSite = ConfigurationManager.AppSettings["DefaultSiteName"];
        private static string filePath = ConfigurationManager.AppSettings["ReportManagerWebConfigPath"];

        private static string reportServerWSUrl = ConfigurationManager.AppSettings["ReportServerWSUrl"];
        private static string reportServerDataSource = ConfigurationManager.AppSettings["ReportServerDataSource"];
        private static string reportServerDB = ConfigurationManager.AppSettings["ReportServerDB"];
        private static string reportServerDBDomain = ConfigurationManager.AppSettings["ReportServerDBDomain"];
        private static string reportServerDBUser = ConfigurationManager.AppSettings["ReportServerDBUser"];
        private static string reportServerDBPWD = ConfigurationManager.AppSettings["ReportServerDBPWD"];

        private static string anonymousAuthenticationPath = ConfigurationManager.AppSettings["anonymousAuthentication"];
        private static string windowsAuthenticationPath = ConfigurationManager.AppSettings["windowsAuthentication"];

        /// <summary>
        /// Create a website and open it in IIS server
        /// </summary>
        /// <param name="siteName">site name</param>
        /// <param name="physicalPath">physical path in disk</param>
        /// <param name="appPoolName">application pool name</param>
        /// <returns>new site indentifier</returns>
        public static void CreateAnIISSite(string siteName, string physicalPath, string bindingAddress, ref string siteUrl)
        {
            //if forerunnerpool not exist then create on: .net framework version 4.0; mode: classic
            if (!ForerunnerPoolExist())
            {
                AddForerunnerPool();
            }

            using (ServerManager manager = new ServerManager())
            {
                if (manager.Sites[defaultSite] != null)
                {
                    //if default site exist then add app as a sub application
                    Site reportManager = manager.Sites[defaultSite];
                    reportManager.Applications.Add("/" + siteName, physicalPath);
                   
                    Application app = reportManager.Applications["/" + siteName];
                    app.ApplicationPoolName = forerunnerPoolName;

                    siteUrl = GetSiteUrl(reportManager, siteName);
                    manager.CommitChanges();
                    UpdateIISAuthentication(defaultSite + "/" + siteName);
                }
                else
                {
                    //if default site not exist then create a new site.
                    Site reportManager = manager.Sites.Add(siteName, "http", bindingAddress, physicalPath);
                    reportManager.ApplicationDefaults.ApplicationPoolName = forerunnerPoolName;

                    siteUrl = GetSiteUrl(reportManager);
                    manager.CommitChanges();
                    UpdateIISAuthentication(siteName);
                }

            }
        }

        public static bool VerifyIIsSiteNameExist(string siteName)
        {
            using (ServerManager manager = new ServerManager())
            {
                if (manager.Sites[defaultSite] != null)
                {
                    if (manager.Sites[defaultSite].Applications["/" + siteName] != null)
                        return true;
                    else
                        return false;
                }
                else
                {
                    foreach (Site site in manager.Sites)
                    {
                        if (siteName.Equals(site.Name, StringComparison.OrdinalIgnoreCase))
                        {
                            return true;
                        }
                    }
                    return false;
                }
            }
        }

        public static bool VerifyPortFree(ushort port)
        {
            return SystemUtilites.IsPortFree(port);
        }

        public static ushort FindFreePort()
        {
            return SystemUtilites.FindFreeTcpPort();
        }

        private static bool ForerunnerPoolExist()
        {
            using (ServerManager serverManager = new ServerManager())
            {
                foreach (ApplicationPool pool in serverManager.ApplicationPools)
                {
                    if (forerunnerPoolName.Equals(pool.Name, StringComparison.OrdinalIgnoreCase))
                    {
                        return true;
                    }
                }
                return false;
            }
        }

        private static void AddForerunnerPool()
        {
            using (ServerManager serverManager = new ServerManager())
            {
                ApplicationPool newpool = serverManager.ApplicationPools.Add(forerunnerPoolName);
                newpool.ManagedPipelineMode = ManagedPipelineMode.Integrated;
                newpool.ManagedRuntimeVersion = "v4.0";
                serverManager.CommitChanges();
            }
        }

        private static string GetSiteUrl(Site site, string siteName = "")
        {
            string ip = string.Empty;
            string port = string.Empty;

            foreach (Binding binding in site.Bindings)
            {
                if (binding.Protocol.Equals("http", StringComparison.OrdinalIgnoreCase))
                {
                    if (binding.BindingInformation.Contains("*"))
                    {
                        ip = "localhost";
                    }
                    else
                    {
                        ip = binding.BindingInformation.Substring(0, binding.BindingInformation.IndexOf(":"));
                    }
                    if (binding.EndPoint.Port != 80)
                    {
                        port = ":" + binding.EndPoint.Port.ToString();
                    }
                }
            }

            return string.Format("http://{0}{1}/{2}", ip, port, siteName);
        }

        /// <summary>
        /// Disable anonymous authentication and enable windows authentication
        /// Need IIS 7 or higher.
        /// 
        /// Microsoft.Web.Administration.dll Under: Forerunner\RS\Externals\IIS\Microsoft.Web.Administration.dll
        /// </summary>
        /// <param name="siteName">target site name</param>
        private static void UpdateIISAuthentication(string siteName)
        {
            using (ServerManager serverManager = new ServerManager())
            {
                Microsoft.Web.Administration.Configuration config = serverManager.GetApplicationHostConfiguration();

                //disable anonymous authentication which is the default value of IIS
                Microsoft.Web.Administration.ConfigurationSection anonymousAuthenticationSection = config.GetSection(anonymousAuthenticationPath, siteName);
                anonymousAuthenticationSection["enabled"] = false;

                //Enable window authentication
                Microsoft.Web.Administration.ConfigurationSection windowsAuthenticationSection = config.GetSection(windowsAuthenticationPath, siteName);
                windowsAuthenticationSection["enabled"] = true;

                serverManager.CommitChanges();
            }
        }

        /// <summary>
        /// Create a website and open it in USW Server
        /// </summary>
        /// <param name="siteName">site name</param>
        /// <param name="physicalPath">physical path in disk</param>
        /// <returns>new site indentifier</returns>
        public static void CreateAnUWSSite(string siteName, string physicalPath, string bindingAddress, ref string siteUrl)
        {
            //Console.WriteLine("Register begin to deploy the site to the UWS Server !");

            Guid guid = Guid.NewGuid();
            
            WebAppConfigEntry entry = Metabase.GetWebAppEntry(guid);
            entry.ApplicationName = siteName;
            entry.VirtualDirectory = siteName;
            entry.AppType = ApplicationType.AspNetOrStaticHtml;
            entry.AuthenicationMode = AuthenticationSchemes.IntegratedWindowsAuthentication;
            entry.CompressResponseIfPossible = true;          

            ListenAddress address = new ListenAddress(bindingAddress);            
            entry.ListenAddresses.Clear();
            entry.ListenAddresses.Add(address);
            entry.PhysicalDirectory = physicalPath;
            
            Metabase.RegisterApplication(RuntimeVersion.AspNet_4, false, false, ProcessIdentity.NetworkService, entry);
            Metabase.WaitForAppToStart(guid,2000);

            //siteUrl = bindingAddress + "/" + siteName;
            siteUrl = "localhost" + "/" + siteName;
            //Console.WriteLine("Deploy Done! New application's guid in UWS is: " + guid);
        }

        /// <summary>
        /// Update Report Manager web.config file
        /// </summary>
        /// <param name="wsurl">Report Service Web Service Url</param>
        /// <param name="testaccount">User Account</param>
        /// <param name="testaccountpwd">User Account Password</param>
        /// <param name="testaccountdomain">User Account Domain</param>
        /// <param name="reportserverdatasource">Report Service Server Data Source</param>
        /// <param name="reportserverdb">Report Server Database Name</param>
        /// <param name="reportserverdbuser">Report Server Database User</param>
        /// <param name="reportserverdbpwd">Report Server Database User Password</param>
        public static void UpdateForerunnerWebConfig(string wsurl, string reportserverdatasource, string reportserverdb, string reportserverdbuserdomain, string reportserverdbuser, string reportserverdbpwd)
        {
            XmlDocument doc = new XmlDocument();
            //need update in installer
            doc.Load(filePath);

            GetConfigNode(doc,reportServerWSUrl).UpdateValue(wsurl);                       
            
            GetConfigNode(doc, reportServerDataSource).UpdateValue(reportserverdatasource);

            GetConfigNode(doc, reportServerDB).UpdateValue(reportserverdb);

            GetConfigNode(doc, reportServerDBDomain).UpdateValue(reportserverdbuserdomain);

            GetConfigNode(doc, reportServerDBUser).UpdateValue(reportserverdbuser);

            GetConfigNode(doc, reportServerDBPWD).UpdateValue(reportserverdbpwd);

            doc.Save(filePath);
        }

        /// <summary>
        /// Get exist value from web.config
        /// </summary>
        /// <returns>value collection</returns>
        public static Dictionary<string, string> GetConfig()
        {
            Dictionary<string, string> result = new Dictionary<string, string>();

            XmlDocument doc = new XmlDocument();
            doc.Load(filePath);

            result.Add("WSUrl", GetConfigNode(doc, reportServerWSUrl).GetValue());
            result.Add("DataSource", GetConfigNode(doc, reportServerDataSource).GetValue());
            result.Add("Database", GetConfigNode(doc, reportServerDB).GetValue());
            result.Add("UserDomain", GetConfigNode(doc, reportServerDBDomain).GetValue());
            result.Add("User", GetConfigNode(doc, reportServerDBUser).GetValue());
            result.Add("Password", GetConfigNode(doc, reportServerDBPWD).GetValue());

            return result;
        }
    
        /// <summary>
        /// Util method, get specific node from web.config
        /// </summary>
        /// <param name="doc">xml document</param>
        /// <param name="name">key name</param>
        /// <returns>First match node</returns>
        private static XmlNode GetConfigNode(XmlDocument doc, string name)
        {
            string xpath = string.Format("/configuration/appSettings/add[@key='{0}']", name);
            return doc.SelectSingleNode(xpath);
        }

        /// <summary>
        /// Extend method for XmlNode, update value attribute
        /// </summary>
        /// <param name="node">xml node</param>
        private static void UpdateValue(this XmlNode node, string value)
        {
            ((XmlElement)node).SetAttribute("value", value);
        }

        /// <summary>
        /// Extend method for XmlNode, get value attribute
        /// </summary>
        private static string GetValue(this XmlNode node)
        {
            if (((XmlElement)node) == null)
                return "";
            return ((XmlElement)node).GetAttribute("value");
        }
    }
}
