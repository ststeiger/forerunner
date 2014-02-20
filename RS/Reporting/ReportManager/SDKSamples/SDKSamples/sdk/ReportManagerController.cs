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

// Changed...
using System.Security.Principal;
// ...Changed

namespace ReportManager.Controllers
{
    public class SaveParameters
    {
        public string reportPath { get; set; }
        public string parameters { get; set; }
        public string Instance { get; set; }
    }

    // Changed...
    [ExceptionLog]
    [AllowAnonymous]
    // ...Changed
    public class ReportManagerController : ApiController
    {
        private string url = ConfigurationManager.AppSettings["Forerunner.ReportServerWSUrl"];

        private bool IsNativeRS = GetAppSetting("Forerunner.IsNative", true);
        private string SharePointHostName = ConfigurationManager.AppSettings["Forerunner.SharePointHost"];
        private bool useIntegratedSecurity = GetAppSetting("Forerunner.UseIntegratedSecurityForSQL", false);
        private string ReportServerDataSource = ConfigurationManager.AppSettings["Forerunner.ReportServerDataSource"];
        private string ReportServerDB = ConfigurationManager.AppSettings["Forerunner.ReportServerDB"];
        private string ReportServerDBUser = ConfigurationManager.AppSettings["Forerunner.ReportServerDBUser"];
        private string ReportServerDBPWD = ConfigurationManager.AppSettings["Forerunner.ReportServerDBPWD"];
        private string ReportServerDBDomain = ConfigurationManager.AppSettings["Forerunner.ReportServerDBDomain"];
        private string ReportServerSSL = ConfigurationManager.AppSettings["Forerunner.ReportServerSSL"];
        private string DefaultUserDomain = ConfigurationManager.AppSettings["Forerunner.DefaultUserDomain"];
        private Forerunner.Config.WebConfigSection webConfigSection = Forerunner.Config.WebConfigSection.GetConfigSection();

        // Changed...
        private NetworkCredential credentials = new NetworkCredential("TestAccount", "TestPWD!");
        // ...Changed

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

            // Changed...
            Forerunner.SSRS.Manager.ReportManager rm;
            if (configElement == null)
            {
                Credentials DBCred = new Credentials(Credentials.SecurityTypeEnum.Custom, ReportServerDBUser, ReportServerDBDomain == null ? "" : ReportServerDBDomain, ReportServerDBPWD);
                rm = new Forerunner.SSRS.Manager.ReportManager(url, null, ReportServerDataSource, ReportServerDB, DBCred, useIntegratedSecurity, IsNativeRS, DefaultUserDomain, SharePointHostName);
            }
            else
            {
                Credentials DBCred = new Credentials(Credentials.SecurityTypeEnum.Custom, configElement.ReportServerDBUser, configElement.ReportServerDBDomain == null ? "" : configElement.ReportServerDBDomain, configElement.ReportServerDBPWD);
                rm = new Forerunner.SSRS.Manager.ReportManager(configElement.ReportServerWSUrl, null, configElement.ReportServerDataSource, configElement.ReportServerDB, DBCred, configElement.UseIntegratedSecurityForSQL, configElement.IsNative, DefaultUserDomain, configElement.SharePointHost);
            }

            // For the SDKSamples we will programmatically set the credentials. Note that the TestAccount
            // and password are not considered secure so it is ok to hard code it here
            rm.SetCredentials(credentials);
            GenericPrincipal principal = new GenericPrincipal(new GenericIdentity(credentials.UserName), null);
            System.Threading.Thread.CurrentPrincipal = principal;
            System.Web.HttpContext.Current.User = principal;

            return rm;
            // ...Changed
        }
        private HttpResponseMessage GetResponseFromBytes(byte[] result, string mimeType,bool cache = false)
        {
            HttpResponseMessage resp = this.Request.CreateResponse();

            if (result != null)
            {
                resp.Content = new ByteArrayContent(result); ;
                resp.Content.Headers.ContentType = new MediaTypeHeaderValue(mimeType);
                if (cache)
                    resp.Headers.Add("Cache-Control", "max-age=7887000");  //3 months
            }
            else
                resp.StatusCode = HttpStatusCode.NotFound;

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
