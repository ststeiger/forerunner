using System;
using System.Collections.Generic;
using System.DirectoryServices;
using System.Net;
using System.Xml;
using UWS.Configuration;
using UWS.Framework;

namespace ReportMannagerConfigTool
{
    public static class ReportManagerConfig
    {
        private static readonly string iisRoot = "IIS://Localhost/W3SVC";

        /// <summary>
        /// Create a website and open it in IIS server
        /// </summary>
        /// <param name="siteName">site name</param>
        /// <param name="physicalPath">physical path in disk</param>
        /// <param name="appPoolName">application pool name</param>
        /// <returns>new site indentifier</returns>
        public static void CreateAnIISSite(string siteName, string physicalPath, string bindingAddress, string appPoolName = "ASP.NET v4.0")
        {
            Console.WriteLine("Register begin to deploy the site to the IIS Server !");

            DirectoryEntry root = new DirectoryEntry(iisRoot);
            // Find unused ID value for new web site 
            int siteID = 1;
            foreach (DirectoryEntry e in root.Children)
            {
                if (e.SchemaClassName == "IIsWebServer")
                {
                    int ID = Convert.ToInt32(e.Name);
                    if (ID >= siteID)
                    {
                        siteID = ID + 1;
                    }
                }
            }

            // Create web site 
            DirectoryEntry site = (DirectoryEntry)root.Invoke("Create", "IIsWebServer", siteID);
            site.Invoke("Put", "ServerComment", siteName);//web site name 
            site.Invoke("Put", "ServerBindings", bindingAddress);//bind to specific address format ip:port:domain
            site.Invoke("Put", "ServerState", 2);// 2: started, 4 (default): stopped
            site.Invoke("Put", "ServerAutoStart", 1);//auto start server 
            site.Invoke("SetInfo");

            DirectoryEntry siteVDir = site.Children.Add("ROOT", "IISWebVirtualDir");

            //create virtual directory and assign the specific application pool to it
            if (appPoolName != "")
            {
                object[] param = { 0, appPoolName, true };
                siteVDir.Invoke("AppCreate3", param);
            }

            siteVDir.CommitChanges();
            site.CommitChanges();

            siteVDir.Properties["AppIsolated"][0] = 2;//默认2 
            siteVDir.Properties["Path"][0] = physicalPath;//physical path in the disk
            siteVDir.Properties["AccessFlags"][0] = 513;
            siteVDir.Properties["FrontPageWeb"][0] = 1;
            siteVDir.Properties["AppRoot"][0] = "/LM/W3SVC/" + siteID + "/Root";
            siteVDir.Properties["AppFriendlyName"][0] = "Forerunner Report Manager";
            siteVDir.Properties["AspEnableParentPaths"][0] = true;  //open parent path
            siteVDir.CommitChanges();
            site.CommitChanges();

            Console.WriteLine("Deploy Done! New web application's id in IIS is:" + siteID);
        }

        /// <summary>
        /// Create a website and open it in USW Server
        /// </summary>
        /// <param name="siteName">site name</param>
        /// <param name="physicalPath">physical path in disk</param>
        /// <returns>new site indentifier</returns>
        public static void CreateAnUWSSite(string siteName, string physicalPath, string bindingAddress)
        {
            Console.WriteLine("Register begin to deploy the site to the UWS Server !");

            Guid guid = Guid.NewGuid();
            
            WebAppConfigEntry entry = Metabase.GetWebAppEntry(guid);
            entry.ApplicationName = siteName;
            entry.AppType = ApplicationType.AspNetOrStaticHtml;
            entry.AuthenicationMode = AuthenticationSchemes.Anonymous;
            entry.CompressResponseIfPossible = true;

            ListenAddress address = new ListenAddress(bindingAddress);
            entry.ListenAddresses.Clear();
            entry.ListenAddresses.Add(address);

            entry.PhysicalDirectory = physicalPath;
            Metabase.RegisterApplication(RuntimeVersion.AspNet_4, true, true, ProcessIdentity.LocalSystem, entry);

            Console.WriteLine("Deploy Done! New application's guid in UWS is: " + guid);
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
            return ((XmlElement)node).GetAttribute("value");
        }
    }
}
