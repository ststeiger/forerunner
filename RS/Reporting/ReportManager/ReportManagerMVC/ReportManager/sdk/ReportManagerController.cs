// Comment out this definition to get default endpoint implementations
#define MOBILIZER_ENDPOINT

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

    public class SubscriptionInfoPostBack : Forerunner.SSRS.Manager.SubscriptionInfo
    {
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
        static private string MobilizerSettingPath = ConfigurationManager.AppSettings["Forerunner.MobilizerSettingPath"];

        static private string EmptyJSONObject = "{}";
   
        static ReportManagerController()
        {
            ForerunnerUtil.validateConfig(ReportServerDataSource, ReportServerDB, ReportServerDBUser, ReportServerDBPWD, ReportServerDBDomain, useIntegratedSecurity, webConfigSection);
        }

        private Forerunner.SSRS.Manager.ReportManager GetReportManager(string instance)
        {
            Forerunner.SSRS.Manager.ReportManager rm = ForerunnerUtil.GetReportManagerInstance(instance, url, IsNativeRS, DefaultUserDomain, SharePointHostName, ReportServerDataSource, ReportServerDB, ReportServerDBUser, ReportServerDBPWD, ReportServerDBDomain, useIntegratedSecurity, webConfigSection);
            
            //If you need to specify your own credentials set them here, otherwise we will the forms auth cookie or the default network credentials
            //rm.SetCredentials(new NetworkCredential("TestAccount",  "TestPWD!","Forerunner"));            
            return rm;
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

        // "{}"
        private HttpResponseMessage GetEmptyJSONResponse()
        {
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(EmptyJSONObject), "text/JSON");
        }

        // 501
        private HttpResponseMessage GetNotImplementedResponse()
        {
            HttpResponseMessage resp = this.Request.CreateResponse();
            resp.StatusCode = HttpStatusCode.NotImplemented;
            return resp;
        }

        // 404
        private HttpResponseMessage GetNotFoundResponse()
        {
            HttpResponseMessage resp = this.Request.CreateResponse();
            resp.StatusCode = HttpStatusCode.NotFound;
            return resp;
        }

        [HttpGet]
        public HttpResponseMessage GetItems(string view, string path, string instance = null)
        {
#if (MOBILIZER_ENDPOINT)
            try
            {
                string CatItems = new JavaScriptSerializer().Serialize(GetReportManager(instance).GetItems(view, path));
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(CatItems), "text/JSON");
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
#else
            return GetEmptyJSONResponse();
#endif
        }

        [HttpGet]
        public HttpResponseMessage FindItems(string folder, string searchOperator, string searchCriteria, string instance = null) 
        {
#if (MOBILIZER_ENDPOINT)
            try
            {
                CatalogItem[] matchesItems = GetReportManager(instance).FindItems(folder, searchOperator, searchCriteria);
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(ToString(matchesItems)), "text/JSON");
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
#else
            return GetEmptyJSONResponse();
#endif
        }

        [HttpGet]
        public HttpResponseMessage ReportProperty(string path, string propertyName, string instance = null)
        {
#if (MOBILIZER_ENDPOINT)
            try
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(instance).GetItemProperty(path, propertyName)), "text/JSON");
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
#else
            return GetEmptyJSONResponse();
#endif
        }

        public class SaveReprotPropertyPostBack{
            public string value { get; set; } public string path { get; set; } public string propertyName { get; set; } public string instance { get; set; }
        }

        [HttpPost]
        [ActionName("SaveReportProperty")]
        public HttpResponseMessage SaveReportProperty(SaveReprotPropertyPostBack postValue)
        {
#if (MOBILIZER_ENDPOINT)
            HttpResponseMessage resp = this.Request.CreateResponse();
            try
            { 
                GetReportManager(postValue.instance).SetProperty(postValue.path, postValue.propertyName, postValue.value);
                resp.StatusCode = HttpStatusCode.OK;

            }
            catch
            {
                resp.StatusCode = HttpStatusCode.BadRequest;
            }
            
            return resp;
#else
            return GetNotImplementedResponse();
#endif
            
        }

        [HttpGet]
        [ActionName("SaveThumbnail")]
        public HttpResponseMessage SaveThumbnail(string ReportPath, string SessionID, string instance = null)
        {
#if (MOBILIZER_ENDPOINT)
            GetReportManager(instance).SaveThumbnail(ReportPath, SessionID);
            HttpResponseMessage resp = this.Request.CreateResponse();
            resp.StatusCode = HttpStatusCode.OK;
            return resp;
#else
            return GetNotImplementedResponse();
#endif
        }

        [HttpGet]
        [ActionName("Thumbnail")]
        public HttpResponseMessage Thumbnail(string ReportPath,string DefDate, string instance = null)
        {
#if (MOBILIZER_ENDPOINT)
            return GetResponseFromBytes(GetReportManager(instance).GetCatalogImage(ReportPath), "image/JPEG",true);            
#else
            return GetNotFoundResponse();
#endif
        }

        [HttpGet]
        [ActionName("HasPermission")]
        public HttpResponseMessage HasPermission(string path, string permission, string instance = null)
        {
#if (MOBILIZER_ENDPOINT)
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(instance).GetCatalogPermission(path, permission)), "text/JSON");
#else
            return GetEmptyJSONResponse();
#endif
        }

        [HttpGet]
        [ActionName("Resource")]
        public HttpResponseMessage Resource(string path, string instance = null)
        {
#if (MOBILIZER_ENDPOINT)
            byte[] result = null;
            string mimetype = null;
            result = GetReportManager(instance).GetCatalogResource(path, out mimetype);
            return GetResponseFromBytes(result, mimetype);
#else
            return GetNotFoundResponse();
#endif
        }

        [HttpPost]
        public HttpResponseMessage SaveResource(SetResource setResource)
        {
#if (MOBILIZER_ENDPOINT)
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(setResource.rsInstance).SaveCatalogResource(setResource)), "text/JSON");
#else
            return GetNotImplementedResponse();
#endif
        }

        [HttpGet]
        [ActionName("DeleteCatalogItem")]
        public HttpResponseMessage DeleteCatalogItem(string path, string instance = null)
        {
#if (MOBILIZER_ENDPOINT)
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(instance).DeleteCatalogItem(path)), "text/JSON");
#else
            return GetNotImplementedResponse();
#endif
        }

        [HttpGet]
        public HttpResponseMessage UpdateView(string view, string action, string path, string instance = null)
        {
#if (MOBILIZER_ENDPOINT)
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(instance).UpdateView(view,action,path)), "text/JSON");
#else
            return GetNotImplementedResponse();
#endif
        }

        [HttpGet]
        public HttpResponseMessage IsFavorite(string path, string instance = null)
        {
#if (MOBILIZER_ENDPOINT)
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(instance).IsFavorite(path)), "text/JSON");
#else
            return GetEmptyJSONResponse();
#endif
        }

        [HttpGet]
        public HttpResponseMessage GetUserParameters(string reportPath, string instance = null)
        {
#if (MOBILIZER_ENDPOINT)
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(instance).GetUserParameters(reportPath)), "text/JSON");
#else
            return GetEmptyJSONResponse();
#endif
        }
        [HttpPost]
        public HttpResponseMessage SaveUserParameters(SaveParameters saveParams)
        {
#if (MOBILIZER_ENDPOINT)
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(saveParams.Instance).SaveUserParameters(saveParams.reportPath, saveParams.parameters)), "text/JSON");
#else
            return GetNotImplementedResponse();
#endif
        }

        [HttpGet]
        public HttpResponseMessage GetUserSettings(string instance = null)
        {
#if (MOBILIZER_ENDPOINT)
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(instance).GetUserSettings()), "text/JSON");
#else
            return GetEmptyJSONResponse();
#endif
        }

        public HttpResponseMessage GetUserName(string instance = null)
        {
#if (MOBILIZER_ENDPOINT)
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(instance).GetUserName()), "text/JSON");
#else
            return GetEmptyJSONResponse();
#endif
        }

        [HttpGet]
        public HttpResponseMessage SaveUserSettings(string settings, string instance = null)
        {
#if (MOBILIZER_ENDPOINT)
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(instance).SaveUserSettings(settings)), "text/JSON");
#else
            return GetNotImplementedResponse();
#endif
        }

        [HttpPost]
        public HttpResponseMessage CreateSubscription(SubscriptionInfoPostBack info)
        {
#if (MOBILIZER_ENDPOINT)
            try
            {
                info.Report = System.Web.HttpUtility.UrlDecode(info.Report);
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(info.Instance).CreateSubscription(info)), "text/JSON");
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
#else
            return GetNotImplementedResponse();
#endif
        }

        [HttpGet]
        public HttpResponseMessage GetSubscription(string subscriptionID, string instance = null)
        {
#if (MOBILIZER_ENDPOINT)
            Forerunner.SSRS.Manager.SubscriptionInfo info = GetReportManager(instance).GetSubscription(subscriptionID);
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(ToString(info)), "text/JSON"); 
#else
            return GetEmptyJSONResponse();
#endif
        }

        [HttpPost]
        public HttpResponseMessage UpdateSubscription(SubscriptionInfoPostBack info)
        {
#if (MOBILIZER_ENDPOINT)
            try
            {
                GetReportManager(info.Instance).SetSubscription(info);
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(info.SubscriptionID), "text/JSON");
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
#else
            return GetNotImplementedResponse();
#endif
        }

        [HttpGet]
        public HttpResponseMessage DeleteSubscription(string subscriptionID, string instance = null)
        {
#if (MOBILIZER_ENDPOINT)
            string retVal = GetReportManager(instance).DeleteSubscription(subscriptionID);
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(retVal), "text/JSON");
#else
            return GetNotImplementedResponse();
#endif
        }

        [HttpGet]
        public HttpResponseMessage ListSubscriptions(string reportPath, string instance = null)
        {
#if (MOBILIZER_ENDPOINT)
            Subscription[] subscriptions = GetReportManager(instance).ListSubscriptions(reportPath, null);
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(ToString(subscriptions)), "text/JSON"); 
#else
            return GetEmptyJSONResponse();
#endif
        }

        [HttpGet]
        public HttpResponseMessage ListDeliveryExtensions(string instance = null)
        {
#if (MOBILIZER_ENDPOINT)
            Extension[] extensions = GetReportManager(instance).ListDeliveryExtensions();
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(ToString(extensions)), "text/JSON"); 
#else
            return GetEmptyJSONResponse();
#endif
        }

        [HttpGet]
        public HttpResponseMessage GetExtensionSettings(string extension, string instance = null)
        {
#if (MOBILIZER_ENDPOINT)
            ExtensionParameter[] extensionSettings = GetReportManager(instance).GetExtensionSettings(extension);
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(ToString(extensionSettings)), "text/JSON"); 
#else
            return GetEmptyJSONResponse();
#endif
        }

        [HttpGet]
        public HttpResponseMessage ListSchedules(string instance = null)
        {
#if (MOBILIZER_ENDPOINT)
            SubscriptionSchedule[] schedules = GetReportManager(instance).ListSchedules(null);
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(ToString(schedules)), "text/JSON"); 
#else
            return GetEmptyJSONResponse();
#endif
        }

        [HttpGet]
        public HttpResponseMessage GetReportTags(string path, string instance = null)
        {
#if (MOBILIZER_ENDPOINT)
            try
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(instance).GetReportTags(path)), "text/JSON");
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
#else
            return GetEmptyJSONResponse();
#endif
        }
        public class ReportTagsPostBack
        {
            public string reportTags { get; set; }
            public string path { get; set; }
            public string instance { get; set; }
        }
        [HttpPost]
        public HttpResponseMessage SaveReportTags(ReportTagsPostBack postValue)
        {
#if (MOBILIZER_ENDPOINT)
            HttpResponseMessage resp = this.Request.CreateResponse();
            try
            {
                GetReportManager(postValue.instance).SaveReportTags(postValue.reportTags, postValue.path);
                resp.StatusCode = HttpStatusCode.OK;
            }
            catch
            {
                resp.StatusCode = HttpStatusCode.BadRequest;
            }

            return resp;
#else
            return GetNotImplementedResponse();
#endif
        }

        [HttpGet]
        public HttpResponseMessage GetMobilizerSetting(string instance = null)
        {
#if (MOBILIZER_ENDPOINT)
            try
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(instance).ReadMobilizerSetting(MobilizerSettingPath)), "text/JSON");
            }
            catch (Exception ex) 
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(ex)), "text/JSON");
            }
#else
            return GetEmptyJSONResponse();
#endif
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
