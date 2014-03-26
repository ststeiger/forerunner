using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Web.Script.Serialization;
using Forerunner.SSRS.Management;
using Forerunner.SSRS.Manager;
using Forerunner;
using Forerunner.Logging;

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

        static private bool IsNativeRS = ForerunnerUtil.GetAppSetting("Forerunner.IsNative", true);
        static private string SharePointHostName = ConfigurationManager.AppSettings["Forerunner.SharePointHost"];
        static private bool useIntegratedSecurity = ForerunnerUtil.GetAppSetting("Forerunner.UseIntegratedSecurityForSQL", false);
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
            Forerunner.SSRS.Manager.ReportManager.ValidateConfig(reportServerDataSource, reportServerDB, dbCred, useIntegratedSecuritForSQL);            
        }

        static ReportManagerController()
        {
            ForerunnerUtil.CheckSSLConfig();
            
            if (ReportServerDataSource != null)
            {
                Logger.Trace(LogType.Info, "Validating the database connections for the report server db configured in the appSettings section.");
                validateReportServerDB(ReportServerDataSource, ReportServerDB, ReportServerDBUser, ReportServerDBPWD, ReportServerDBDomain, useIntegratedSecurity);
            }

            if (webConfigSection != null)
            {
                foreach(Forerunner.Config.ConfigElement configElement in webConfigSection.InstanceCollection) {
                    Logger.Trace(LogType.Info, "Validating the database connections for the report server db configured in the Forerunner section.  Instance: " + configElement.Instance);
                    validateReportServerDB(configElement.ReportServerDataSource, configElement.ReportServerDB, configElement.ReportServerDBUser, configElement.ReportServerDBPWD, configElement.ReportServerDBDomain, configElement.UseIntegratedSecurityForSQL);
                }
            }
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

            if (result == null || result.Length ==0)
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
        public HttpResponseMessage GetItems(string view, string path, string instance = null)
        {
            try
            {
                string CatItems = new JavaScriptSerializer().Serialize(GetReportManager(instance).GetItems(view, path));
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(CatItems), "text/JSON");
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes("{\"error\": \"" + e.Message + "\"}"), "text/JSON");  
            }
            
        }

        [HttpGet]
        [ActionName("SaveThumbnail")]
        public HttpResponseMessage SaveThumbnail(string ReportPath, string SessionID, string instance = null)
        {
            GetReportManager(instance).SaveThumbnail(ReportPath, SessionID);
            HttpResponseMessage resp = this.Request.CreateResponse();
            resp.StatusCode = HttpStatusCode.OK;
            return resp;
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

        [HttpPost]
        public HttpResponseMessage CreateSubscription(Forerunner.SSRS.Manager.ReportManager.SubscriptionInfo info, string instance = null)
        {
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(instance).CreateSubscription(info)), "text/JSON");
        }

        [HttpGet]
        public HttpResponseMessage GetSubscription(string subscriptionID, string instance = null)
        {
            Forerunner.SSRS.Manager.ReportManager.SubscriptionInfo info = GetReportManager(instance).GetSubscription(subscriptionID);
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(ToString(info)), "text/JSON"); 
        }

        [HttpPost]
        public HttpResponseMessage UpdateSubscription(Forerunner.SSRS.Manager.ReportManager.SubscriptionInfo info, string instance = null)
        {
           
            GetReportManager(instance).SetSubscription(info);
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(info.SubscriptionID), "text/JSON");
        }

        [HttpGet]
        public HttpResponseMessage DeleteSubscription(string subscriptionID, string instance = null)
        {
            GetReportManager(instance).DeleteSubscription(subscriptionID);
            return GetResponseFromBytes(Encoding.UTF8.GetBytes("Success"), "text/JSON");
        }

        [HttpGet]
        public HttpResponseMessage ListSubscriptions(string reportPath, string instance = null)
        {
            /// Need to pass in current owner.
            Subscription[] subscriptions = GetReportManager(instance).ListSubscriptions(reportPath, null);
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(ToString(subscriptions)), "text/JSON"); 
        }

        [HttpGet]
        public HttpResponseMessage ListDeliveryExtensions(string instance = null)
        {
            Extension[] extensions = GetReportManager(instance).ListDeliveryExtensions();
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(ToString(extensions)), "text/JSON"); 
        }

        [HttpGet]
        public HttpResponseMessage GetExtensionSettings(string extension, string instance = null)
        {
            ExtensionParameter[] extensionSettings = GetReportManager(instance).GetExtensionSettings(extension);
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(ToString(extensionSettings)), "text/JSON"); 
        }

        [HttpGet]
        public HttpResponseMessage ListSchedules(string instance = null)
        {
            Schedule[] schedules = GetReportManager(instance).ListSchedules(null);
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(ToString(schedules)), "text/JSON"); 
        }

        private string ToString<T>(T value)
        {
            StringBuilder buffer = new StringBuilder();
            System.Web.Script.Serialization.JavaScriptSerializer serializer = new System.Web.Script.Serialization.JavaScriptSerializer();
            serializer.Serialize(value, buffer);

            return buffer.ToString();
        }
    }
}
