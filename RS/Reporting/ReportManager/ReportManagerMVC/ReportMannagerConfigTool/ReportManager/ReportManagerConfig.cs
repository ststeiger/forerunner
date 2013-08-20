using System;
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
        private static readonly string appPoolName = "ForerunnerPool";

        /// <summary>
        /// Create a website and open it in IIS server
        /// </summary>
        /// <param name="siteName">site name</param>
        /// <param name="physicalPath">physical path in disk</param>
        /// <param name="appPoolName">application pool name</param>
        /// <returns>new site indentifier</returns>
        public static void CreateAnIISSite(string siteName, string physicalPath, string bindingAddress)
        {
            //if forerunnerpool not exist then create on: .net framework version 4.0; mode: classic
            if (!ForerunnerPoolExist())
            {
                AddForerunnerPool();
            }

            using (ServerManager manager = new ServerManager())
            {
                Site reportManager = manager.Sites.Add(siteName, "http", bindingAddress, physicalPath);
                reportManager.ServerAutoStart = true;
                reportManager.ApplicationDefaults.ApplicationPoolName = appPoolName;

                manager.CommitChanges();
            }

            UpdateIISAuthentication(siteName);
        }

        public static bool VerifySiteNameExist(string siteName)
        {
            using (ServerManager manager = new ServerManager())
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

        private static bool ForerunnerPoolExist()
        {
            using (ServerManager serverManager = new ServerManager())
            {
                foreach (ApplicationPool pool in serverManager.ApplicationPools)
                {
                    if (appPoolName.Equals(pool.Name, StringComparison.OrdinalIgnoreCase))
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
                ApplicationPool newpool = serverManager.ApplicationPools.Add(appPoolName);
                newpool.ManagedPipelineMode = ManagedPipelineMode.Integrated;
                newpool.ManagedRuntimeVersion = "v4.0";
                serverManager.CommitChanges();
            }
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
                Configuration config = serverManager.GetApplicationHostConfiguration();

                //disable anonymous authentication which is the default value of IIS
                ConfigurationSection anonymousAuthenticationSection = config.GetSection("system.webServer/security/authentication/anonymousAuthentication", siteName);
                anonymousAuthenticationSection["enabled"] = false;

                //Enable window authentication
                ConfigurationSection windowsAuthenticationSection = config.GetSection("system.webServer/security/authentication/windowsAuthentication", siteName);
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
        public static void CreateAnUWSSite(string siteName, string physicalPath, string bindingAddress)
        {
            //Console.WriteLine("Register begin to deploy the site to the UWS Server !");

            Guid guid = Guid.NewGuid();
            
            WebAppConfigEntry entry = Metabase.GetWebAppEntry(guid);
            entry.ApplicationName = siteName;
            entry.VirtualDirectory = siteName;
            entry.AppType = ApplicationType.AspNetOrStaticHtml;
            entry.AuthenicationMode = AuthenticationSchemes.IntegratedWindowsAuthentication;
            entry.CompressResponseIfPossible = true;          

            //ListenAddress address = new ListenAddress(bindingAddress);
            entry.ListenAddresses.Clear();
            //entry.ListenAddresses.Add(address);

            entry.PhysicalDirectory = physicalPath;

            Metabase.RegisterApplication(RuntimeVersion.AspNet_4, false, false, ProcessIdentity.NetworkService, entry);
            Metabase.WaitForAppToStart(guid,2000);

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
            string filePath = "Web.config";
            doc.Load(filePath);

            GetConfigNode(doc, "Forerunner.ReportServerWSUrl").UpdateValue(wsurl);                       
            
            GetConfigNode(doc, "Forerunner.ReportServerDataSource").UpdateValue(reportserverdatasource);

            GetConfigNode(doc, "Forerunner.ReportServerDB").UpdateValue(reportserverdb);

            GetConfigNode(doc, "Forerunner.ReportServerDBDomain").UpdateValue(reportserverdbuserdomain);

            GetConfigNode(doc, "Forerunner.ReportServerDBUser").UpdateValue(reportserverdbuser);

            GetConfigNode(doc, "Forerunner.ReportServerDBPWD").UpdateValue(reportserverdbpwd);

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
            doc.Load("Web.config");

            result.Add("WSUrl", GetConfigNode(doc, "Forerunner.ReportServerWSUrl").GetValue());
            result.Add("DataSource", GetConfigNode(doc, "Forerunner.ReportServerDataSource").GetValue());
            result.Add("Database", GetConfigNode(doc, "Forerunner.ReportServerDB").GetValue());
            result.Add("UserDomain", GetConfigNode(doc, "Forerunner.ReportServerDBDomain").GetValue());
            result.Add("User", GetConfigNode(doc, "Forerunner.ReportServerDBUser").GetValue());
            result.Add("Password", GetConfigNode(doc, "Forerunner.ReportServerDBPWD").GetValue());

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
