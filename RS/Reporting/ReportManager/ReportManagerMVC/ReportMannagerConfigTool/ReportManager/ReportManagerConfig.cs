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
        private static string reportServerDBAccountType = ConfigurationManager.AppSettings["ReportServerDBAccountType"];

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
                XmlDocument doc = new XmlDocument();
                doc.Load(filePath);

                Microsoft.Web.Administration.Configuration config = serverManager.GetApplicationHostConfiguration();

                //disable anonymous authentication which is the default value of IIS
                Microsoft.Web.Administration.ConfigurationSection anonymousAuthenticationSection = config.GetSection(anonymousAuthenticationPath, siteName);

                //Enable window authentication
                Microsoft.Web.Administration.ConfigurationSection windowsAuthenticationSection = config.GetSection(windowsAuthenticationPath, siteName);

                if (GetAuthNode(doc).GetAuthMode() == StaticMessages.windowsAuth)
                {
                    anonymousAuthenticationSection["enabled"] = false;
                    windowsAuthenticationSection["enabled"] = true;
                }
                else if (GetAuthNode(doc).GetAuthMode() == StaticMessages.formsAuth)
                {
                    anonymousAuthenticationSection["enabled"] = true;
                    windowsAuthenticationSection["enabled"] = false;
                }

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
        public static void UpdateForerunnerWebConfig(string wsurl, string reportserverdatasource, string reportserverdb, string reportserverdbuserdomain, 
            string reportserverdbuser, string reportserverdbpwd, string dblogininfo, string authtype)
        {
            XmlDocument doc = new XmlDocument();
            doc.Load(filePath);

            GetAppSettingNode(doc,reportServerWSUrl).SetAppSettingValue(wsurl);                       
            
            GetAppSettingNode(doc, reportServerDataSource).SetAppSettingValue(reportserverdatasource);

            GetAppSettingNode(doc, reportServerDB).SetAppSettingValue(reportserverdb);

            GetAppSettingNode(doc, reportServerDBDomain).SetAppSettingValue(reportserverdbuserdomain);

            GetAppSettingNode(doc, reportServerDBUser).SetAppSettingValue(reportserverdbuser);

            GetAppSettingNode(doc, reportServerDBPWD).SetAppSettingValue(reportserverdbpwd);

            GetAppSettingNode(doc, reportServerDBAccountType).SetAppSettingValue(dblogininfo);

            GetAuthNode(doc).SetAuthMode(authtype, doc);

            doc.Save(filePath);
        }

        /// <summary>
        /// Get exist value from web.config
        /// </summary>
        /// <returns>value collection</returns>
        public static Dictionary<string, string> GetForerunnerWebConfig()
        {
            Dictionary<string, string> result = new Dictionary<string, string>();

            XmlDocument doc = new XmlDocument();
            doc.Load(filePath);

            result.Add("WSUrl", GetAppSettingNode(doc, reportServerWSUrl).GetAppSettingValue());
            result.Add("DataSource", GetAppSettingNode(doc, reportServerDataSource).GetAppSettingValue());
            result.Add("Database", GetAppSettingNode(doc, reportServerDB).GetAppSettingValue());
            result.Add("UserDomain", GetAppSettingNode(doc, reportServerDBDomain).GetAppSettingValue());
            result.Add("User", GetAppSettingNode(doc, reportServerDBUser).GetAppSettingValue());
            result.Add("Password", GetAppSettingNode(doc, reportServerDBPWD).GetAppSettingValue());
            result.Add("DBAccountType", GetAppSettingNode(doc, reportServerDBAccountType).GetAppSettingValue());
            result.Add("AuthType", GetAuthNode(doc).GetAuthMode());

            return result;
        }
    
        /// <summary>
        /// Util method, get specific node from web.config
        /// </summary>
        /// <param name="doc">xml document</param>
        /// <param name="name">key name</param>
        /// <returns>First match node</returns>
        private static XmlElement GetAppSettingNode(XmlDocument doc, string name)
        {
            string xpath = string.Format("/configuration/appSettings/add[@key='{0}']", name);
            return doc.SelectSingleNode(xpath) as XmlElement;
        }

        /// <summary>
        /// Extend method for XmlNode, update value attribute
        /// </summary>
        /// <param name="node">xml node</param>
        private static void SetAppSettingValue(this XmlElement node, string value)
        {
            if (node != null)
            {
                node.SetAttribute("value", value);
            }
        }

        /// <summary>
        /// Extend method for XmlNode, get value attribute
        /// </summary>
        private static string GetAppSettingValue(this XmlElement node)
        {
            if (node == null)
            {
                return string.Empty;
            }
            return node.GetAttribute("value");
        }

        private static void CheckAuthType(XmlDocument doc, string authtype)
        {
            if (authtype.Equals(StaticMessages.formsAuth))
            {
                XmlNode authNode = GetAuthNode(doc) as XmlNode;
                if (authNode.SelectSingleNode("forms") == null)
                {
                    authNode.AppendChild(FormsNode(doc));
                }
            }
            else if (authtype.Equals(StaticMessages.windowsAuth))
            {
                XmlNode authNode = GetAuthNode(doc) as XmlNode;
                if (authNode.SelectSingleNode("forms") != null)
                {
                    authNode.RemoveChild(GetAuthNode(doc).SelectSingleNode("forms"));
                }
                
            }
        }

        private static XmlElement GetAuthNode(XmlDocument doc)
        {
             string xpath = "/configuration/system.web/authentication";
             return doc.SelectSingleNode(xpath) as XmlElement;
        }

        private static string GetAuthMode(this XmlElement authNode)
        {
            if (authNode == null)
            {
                return string.Empty;
            }
            return authNode.GetAttribute("mode");
        }

        private static void SetAuthMode(this XmlElement authNode, string authType, XmlDocument doc)
        {
            if (authNode != null)
            {
                authNode.SetAttribute("mode", authType);
                CheckAuthType(doc, authType);
            }
        }

        private static XmlNode FormsNode(XmlDocument doc)
        {
            XmlNode node = doc.CreateNode(XmlNodeType.Element, "forms", doc.NamespaceURI);

            XmlAttribute loginUrl = doc.CreateAttribute("loginUrl");
            loginUrl.InnerText = ConfigurationManager.AppSettings["FormAuthenticationLoginUrl"];

            XmlAttribute timeOut = doc.CreateAttribute("timeout");
            timeOut.InnerText = ConfigurationManager.AppSettings["FormAuthenticationTimeout"];

            XmlAttribute name = doc.CreateAttribute("name");
            name.InnerText = ConfigurationManager.AppSettings["FormAuthenticationName"];

            node.Attributes.Append(loginUrl);
            node.Attributes.Append(timeOut);
            node.Attributes.Append(name);

            return node;
        }
    }
}
