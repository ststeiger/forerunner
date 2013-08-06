using System.IO;
using System.Linq;
using System.Xml.Linq;

namespace ReportMannagerConfigTool
{
    public static class RenderExtensionConfig
    {
        #region Static Strings
        private static readonly string forerunnerJSONDLL = "SSRSExtension/Forerunner.Json.dll";
        private static readonly string forerunnerRenderExtensionDLL = "SSRSExtension/Forerunner.RenderingExtensions.dll";

        private static readonly string rplRendering = "Microsoft.ReportingServices.RPLRendering";
        private static readonly string htmlRendering = "Microsoft.ReportingServices.HTMLRendering";
        private static readonly string forerunnerJSON = "ForerunnerJSON";
        private static readonly string forerunnerThumbnail = "ForerunnerThumbnail";
        private static readonly string codeGroupName = "Forerunner_JSON_Renderer";

        private static readonly string xForerunnerJSON = "<Extension Name='ForerunnerJSON' Type='Forerunner.RenderingExtensions.JSONRenderer,Forerunner.RenderingExtensions'  Visible='false'/>";
        private static readonly string xForerunnerThumbnail = "<Extension Name='ForerunnerThumbnail' Type='Forerunner.RenderingExtensions.ThumbnailRenderer,Forerunner.RenderingExtensions'  Visible='false'/>";
        private static readonly string xCodeGroup = "<CodeGroup class='UnionCodeGroup' version='1' PermissionSetName='FullTrust' Name='Forerunner_JSON_Renderer' Description='This code group grants Forerunner JSON Renderer code full trust.'><IMembershipCondition class='StrongNameMembershipCondition' version='1' PublicKeyBlob='0024000004800000940000000602000000240000525341310004000001000100b3ce6944622dd1d04857d494118907f56368d05042eec4ac87160554f250bc7fab32362151aef7e898e48fa0867cde4dca5c40cabc790a39b1cebf76921ba1744834666a1876f6980a969e726d8d7eae37a7089b55d5adccbf772a5d17c6705b75656ee727d2eeac5338f64d57817508d4e61bbffa809e27eee28d2d22da64c5' /></CodeGroup>";

        public static readonly string webConfig = "/web.config";
        public static readonly string rsConfig = "/rsreportserver.config";
        public static readonly string srvPolicyConfig = "/rssrvpolicy.config";
        #endregion

        /// <summary>
        /// Add render extension dll files to ReportServer/bin folder
        /// </summary>
        /// <param name="targetPath">ReportServer/bin</param>
        public static bool copyRenderExtensionDLL(string targetPath)
        {
            try
            {
                if (File.Exists(forerunnerJSONDLL))
                {
                    File.Copy(forerunnerJSONDLL, targetPath + "/Forerunner.Json.dll",true);
                }
                if (File.Exists(forerunnerRenderExtensionDLL))
                {
                    File.Copy(forerunnerRenderExtensionDLL, targetPath + "/Forerunner.RenderingExtensions.dll",true);
                }
            }
            catch
            {
                return false;
            }
            
            return true;
        }

        /// <summary>
        /// Remove render extension dll files from ReportServer/bin folder
        /// </summary>
        /// <param name="targetPath">ReportServer/bin</param>
        public static bool removeRenderExtensionDLL(string targetPath)
        {
            try
            {
                if (File.Exists(targetPath + "/Forerunner.Json.dll"))
                {
                    File.Delete(targetPath + "/Forerunner.Json.dll");
                }
                if (File.Exists(targetPath + "/Forerunner.RenderingExtensions.dll"))
                {
                    File.Delete(targetPath + "/Forerunner.RenderingExtensions.dll");
                }
            }
            catch
            {
                return false;
            }
            return true;
        }

        /// <summary>
        /// Add web.config file under MS Sql Server/Report Service/Report Server folder
        /// Add RPLRendering and HTMLRendering node
        /// </summary>
        /// <param name="path">web.config specific path</param>
        /// <returns>Success or not</returns>
        public static bool updateWebConfig(string path)
        {
            try
            {
                XDocument doc = XDocument.Load(path + webConfig);
                XNamespace ns = "urn:schemas-microsoft-com:asm.v1";
                
                var result = from a in doc.Descendants(ns + "assemblyIdentity")
                             where a.Attribute("name").Value == rplRendering
                             select a;

                if (result.Count() == 0)
                {
                    XElement root = doc.Root.Element("runtime").Element(ns + "assemblyBinding");
                    root.Add(getRPLRendering(ns));
                }

                result = from a in doc.Descendants(ns + "assemblyIdentity")
                         where a.Attribute("name").Value == htmlRendering
                         select a;

                if (result.Count() == 0)
                {
                    XElement root = doc.Root.Element("runtime").Element(ns + "assemblyBinding");
                    root.Add(getHTMLRendering(ns));
                }

                doc.Save(path + webConfig);
            }
            catch {

                return false;
            }
            return true;
        }

        /// <summary>
        /// Remove RPLRendering and HTMLRendering node from web.config file 
        /// under MS Sql Server/Report Service/Report Server folder
        /// </summary>
        /// <param name="path">web.config specific path</param>
        /// <returns>Success or not</returns>
        public static bool removeWebConfig(string path)
        {
            try
            {
                XDocument doc = XDocument.Load(path + webConfig);
                XNamespace ns = "urn:schemas-microsoft-com:asm.v1";

                var result = from a in doc.Descendants(ns + "dependentAssembly")
                             where a.Element(ns + "assemblyIdentity").Attribute("name").Value == rplRendering ||
                                   a.Element(ns + "assemblyIdentity").Attribute("name").Value == htmlRendering
                             select a;

                if (result.Count() > 0)
                    result.Remove();

                doc.Save(path + webConfig);
            }
            catch
            {
                return false;
            }
            return true;
        }

        /// <summary>
        /// Update RSReportServer.config file under MS Sql Server/Report Service/Report Server folder 
        /// 
        /// Add ForerunnerJSON and ForerunnerThumbnail
        /// </summary>
        /// <param name="path">config file specific path</param>
        /// <returns>Success or not</returns>
        public static bool updateRSReportServerConfig(string path)
        {
            try
            {
                XDocument doc = XDocument.Load(path + rsConfig);

                var result = from a in
                                 (from b in doc.Descendants("Render") select b).Descendants("Extension")
                             where a.Attribute("Name").Value == forerunnerJSON
                             select a;

                if (result.Count() == 0)
                {
                    XElement json = XElement.Parse(xForerunnerJSON);
                    XElement root = (from b in doc.Descendants("Render") select b).First();

                    root.Add(json);
                }

                result = from a in
                             (from b in doc.Descendants("Render") select b).Descendants("Extension")
                         where a.Attribute("Name").Value == forerunnerThumbnail
                         select a;

                if (result.Count() == 0)
                {
                    XElement thumbnail = XElement.Parse(xForerunnerThumbnail);
                    XElement root = (from b in doc.Descendants("Render") select b).First();

                    root.Add(thumbnail);
                }

                doc.Save(path + rsConfig);
            }
            catch
            {
                return false;
            }
            return true;
        }

        /// <summary>
        /// Remove ForerunnerJSON and ForerunnerThumbnail from  RSReportServer.config file 
        /// under MS Sql Server/Report Service/Report Server folder 
        /// </summary>
        /// <param name="path">config file specific path</param>
        /// <returns>Success or not</returns>
        public static bool removeRSReportServerConfig(string path)
        {
            try
            {
                XDocument doc = XDocument.Load(path + rsConfig);

                var result = from a in
                                 (from b in doc.Descendants("Render") select b).Descendants("Extension")
                             where a.Attribute("Name").Value == forerunnerJSON || a.Attribute("Name").Value == forerunnerThumbnail
                             select a;

                if (result.Count() > 0)
                    result.Remove();

                doc.Save(path + rsConfig);
            }
            catch
            {
                return false;
            }
            return true;
        }

        /// <summary>
        /// Update rssrvpolicy.config file under MS Sql Server/Report Service/Report Server folder
        /// 
        /// Add Forerunner JSON Renderer CodeGroup next to CodeGen CodeGroup
        /// </summary>
        /// <param name="path">config file specific path</param>
        /// <returns>Success or not</returns>
        public static bool updateRSPolicyConfig(string path)
        {
            try
            {
                XDocument doc = XDocument.Load(path + srvPolicyConfig);

                var forerunner = from a in doc.Descendants("CodeGroup")
                                 where a.Attribute("Name") != null && a.Attribute("Name").Value == codeGroupName
                                 select a;

                if (forerunner.Count() == 0)
                {
                    //Find CodeGroup which ImembershipCondition's url == CodeGen
                    var result = from a in doc.Descendants("CodeGroup")
                                 where a.Element("IMembershipCondition").Attribute("Url") != null && a.Element("IMembershipCondition").Attribute("Url").Value.Contains("CodeGen")
                                 select a;

                    XElement codeGroup = XElement.Parse(xCodeGroup);

                    result.First().AddAfterSelf(codeGroup);
                }

                doc.Save(path + srvPolicyConfig);
            }
            catch
            {
                return false;
            }
            return true;
        }

        /// <summary>
        /// Remove Forerunner JSON Renderer CodeGroup  rssrvpolicy.config file 
        /// under MS Sql Server/Report Service/Report Server folder
        /// </summary>
        /// <param name="path">config file specific path</param>
        /// <returns>Success or not</returns>
        public static bool removeRSPolicyConfig(string path)
        {
            try
            {
                XDocument doc = XDocument.Load(path + srvPolicyConfig);

                var forerunner = from a in doc.Descendants("CodeGroup")
                                 where a.Attribute("Name") != null && a.Attribute("Name").Value == codeGroupName
                                 select a;

                if (forerunner.Count() > 0)
                    forerunner.Remove();

                doc.Save(path + srvPolicyConfig);
            }
            catch
            {
                return false;
            }
            return true;
        }

        /// <summary>
        /// Get RPL rendering node
        /// </summary>
        /// <param name="nameSpace"></param>
        /// <returns>RPL render node</returns>
        private static XElement getRPLRendering(XNamespace nameSpace)
        {
            return getRendering(rplRendering, nameSpace);
        }

        /// <summary>
        /// Get HTML rendering node
        /// </summary>
        /// <param name="nameSpace"></param>
        /// <returns>HTML render node</returns>
        private static XElement getHTMLRendering(XNamespace nameSpace)
        {
            return getRendering(htmlRendering, nameSpace);
        }

        /// <summary>
        /// generate generic rendering node
        /// </summary>
        /// <param name="assemblyName">RPLRendering or HTMLRendering</param>
        /// <param name="nameSpace">XML node namespace</param>
        /// <returns>Static xml node</returns>
        private static XElement getRendering(string assemblyName, XNamespace nameSpace)
        {
            XElement ele = new XElement(nameSpace + "dependentAssembly",
               new XElement(nameSpace + "assemblyIdentity",
                   new XAttribute("name", assemblyName),
                   new XAttribute("publicKeyToken", "89845dcd8080cc91"),
                   new XAttribute("culture", "neutral")),
               new XElement(nameSpace + "bindingRedirect",
                   new XAttribute("oldVersion", "8.0.242.0"),
                   new XAttribute("newVersion", "11.0.0.0")),
               new XElement(nameSpace + "bindingRedirect",
                   new XAttribute("oldVersion", "9.0.242.0"),
                   new XAttribute("newVersion", "11.0.0.0")),
               new XElement(nameSpace + "bindingRedirect",
                   new XAttribute("oldVersion", "10.0.0.0"),
                   new XAttribute("newVersion", "11.0.0.0")));

            return ele;
        }
    }
}
