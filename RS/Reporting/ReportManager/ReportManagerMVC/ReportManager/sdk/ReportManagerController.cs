using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Net.Http.Headers;
using System.Text;
using Forerunner.SSRS.Management;
using Forerunner.SSRS.Manager;
using Forerunner;
using ReportManager.Util.Logging;

namespace ReportManager.Controllers
{
    public class SaveParameters
    {
        public string reportPath { get; set; }
        public string parameters { get; set; }
        public string Instance { get; set; }
    }

    [ExceptionLog]
    [Authorize]
    public class ReportManagerController : ApiController
    {
        static private string url = ConfigurationManager.AppSettings["Forerunner.ReportServerWSUrl"];

        static private bool IsNativeRS = GetAppSetting("Forerunner.IsNative", true);
        static private string SharePointHostName = ConfigurationManager.AppSettings["Forerunner.SharePointHost"];
        static private bool useIntegratedSecurity = GetAppSetting("Forerunner.UseIntegratedSecurityForSQL", false);
        static private bool IgnoreSSLErrors = GetAppSetting("Forerunner.IgnoreSSLErrors", false);
        static private string ReportServerDataSource = ConfigurationManager.AppSettings["Forerunner.ReportServerDataSource"];
        static private string ReportServerDB = ConfigurationManager.AppSettings["Forerunner.ReportServerDB"];
        static private string ReportServerDBUser = ConfigurationManager.AppSettings["Forerunner.ReportServerDBUser"];
        static private string ReportServerDBPWD = ConfigurationManager.AppSettings["Forerunner.ReportServerDBPWD"];
        static private string ReportServerDBDomain = ConfigurationManager.AppSettings["Forerunner.ReportServerDBDomain"];
        static private string ReportServerSSL = ConfigurationManager.AppSettings["Forerunner.ReportServerSSL"];
        static private string DefaultUserDomain = ConfigurationManager.AppSettings["Forerunner.DefaultUserDomain"];
        static private Forerunner.Config.WebConfigSection webConfigSection = Forerunner.Config.WebConfigSection.GetConfigSection();

        private static void validateReportServerDB(String reportServerDataSource, string reportServerDB, string reportServerDBUser, string reportServerDBPWD, string reportServerDBDomain, bool useIntegratedSecuritForSQL)
        {
            Credentials dbCred = new Credentials(Credentials.SecurityTypeEnum.Custom, reportServerDBUser, reportServerDBDomain == null ? "" : reportServerDBDomain, reportServerDBPWD);
            if (Forerunner.SSRS.Manager.ReportManager.ValidateConfig(reportServerDataSource, reportServerDB, dbCred, useIntegratedSecuritForSQL))
            {
                Logger.Trace(LogType.Info, "Validation of the report server database succeeded.");
            }
            else
            {
                Logger.Trace(LogType.Error, "Validation of the report server database  failed.");
            }
        }

        static ReportManagerController()
        {
            if (IgnoreSSLErrors)
                ServicePointManager.ServerCertificateValidationCallback += (sender, certificate, chain, sslPolicyErrors) => true;

            if (ReportServerDataSource != null)
            {
                Logger.Trace(LogType.Info, "Validating the database connections for the report server db configured in the appSettings section.");
                validateReportServerDB(ReportServerDataSource, ReportServerDB, ReportServerDBUser, ReportServerDBPWD, ReportServerDBDomain, useIntegratedSecurity);
            }

            if (webConfigSection != null)
            {
                foreach (Forerunner.Config.ConfigElement configElement in webConfigSection.InstanceCollection)
                {
                    Logger.Trace(LogType.Info, "Validating the database connections for the report server db configured in the Forerunner section.  Instance: " + configElement.Instance);
                    validateReportServerDB(configElement.ReportServerDataSource, configElement.ReportServerDB, configElement.ReportServerDBUser, configElement.ReportServerDBPWD, configElement.ReportServerDBDomain, configElement.UseIntegratedSecurityForSQL);
                }
            }
        }

        static private bool GetAppSetting(string key, bool defaultValue)
        {
            string value = ConfigurationManager.AppSettings[key];
            return (value == null) ? defaultValue : String.Equals("true", value.ToLower());
        }
        private Forerunner.SSRS.Manager.ReportManager GetReportManager(string instance)
        {
            Forerunner.Config.ConfigElement configElement = null;
            if (webConfigSection != null && instance != null)
            {
                Forerunner.Config.ConfigElementCollection configElementCollection = webConfigSection.InstanceCollection;
                if (configElementCollection != null)
                {
                    configElement = configElementCollection.GetElementByKey(instance);
                }
            }
            //Put application security here

            if (configElement == null)
            {
                Credentials DBCred = new Credentials(Credentials.SecurityTypeEnum.Custom, ReportServerDBUser, ReportServerDBDomain == null ? "" : ReportServerDBDomain, ReportServerDBPWD);
                return new Forerunner.SSRS.Manager.ReportManager(url, null, ReportServerDataSource, ReportServerDB, DBCred, useIntegratedSecurity, IsNativeRS, DefaultUserDomain, SharePointHostName);
            }
            else
            {
                Credentials DBCred = new Credentials(Credentials.SecurityTypeEnum.Custom, configElement.ReportServerDBUser, configElement.ReportServerDBDomain == null ? "" : configElement.ReportServerDBDomain, configElement.ReportServerDBPWD);
                return new Forerunner.SSRS.Manager.ReportManager(configElement.ReportServerWSUrl, null, configElement.ReportServerDataSource, configElement.ReportServerDB, DBCred, configElement.UseIntegratedSecurityForSQL, configElement.IsNative, DefaultUserDomain, configElement.SharePointHost);
            }
        }
        private HttpResponseMessage GetResponseFromBytes(byte[] result, string mimeType,bool cache = false)
        {
            HttpResponseMessage resp = this.Request.CreateResponse();

            if (result == null || result.Length == 0)
            {
                resp.StatusCode = HttpStatusCode.NotFound;
            }
            else
            {
                resp.Content = new ByteArrayContent(result); ;
                resp.Content.Headers.ContentType = new MediaTypeHeaderValue(mimeType);
                if (cache)
                    resp.Headers.Add("Cache-Control", "max-age=7887000");  //3 months
            }

            return resp;
        }
        // GET api/ReportMananger/GetItems
        [HttpGet]
        public IEnumerable<CatalogItem> GetItems(string view, string path, string instance = null)
        {
            
            return GetReportManager(instance).GetItems(view, path);
        }


        [HttpGet]
        [ActionName("Thumbnail")]
        public HttpResponseMessage Thumbnail(string ReportPath,string DefDate, string instance = null)
        {
            return GetResponseFromBytes(GetReportManager(instance).GetCatalogImage(ReportPath), "image/JPEG",true);            
        }

        [HttpGet]
        public HttpResponseMessage UpdateView(string view, string action, string path, string instance = null)
        {
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(instance).UpdateView(view,action,path)), "text/JSON");
        }

        [HttpGet]
        public HttpResponseMessage IsFavorite(string path, string instance = null)
        {
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(instance).IsFavorite(path)), "text/JSON");
        }

        [HttpGet]
        public HttpResponseMessage GetUserParameters(string reportPath, string instance = null)
        {
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(instance).GetUserParameters(reportPath)), "text/JSON");
        }
        [HttpPost]
        public HttpResponseMessage SaveUserParameters(SaveParameters saveParams)
        {
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(saveParams.Instance).SaveUserParamaters(saveParams.reportPath, saveParams.parameters)), "text/JSON");
        }

        [HttpGet]
        public HttpResponseMessage GetUserSettings(string instance = null)
        {
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(instance).GetUserSettings()), "text/JSON");
        }
        [HttpGet]
        public HttpResponseMessage SaveUserSettings(string settings, string instance = null)
        {
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(instance).SaveUserSettings(settings)), "text/JSON");
        }
    }
}
