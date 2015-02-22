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
        static private string MobilizerVersionPath = ConfigurationManager.AppSettings["Forerunner.VersionPath"];        
        static private bool UseMobilizerDB = ForerunnerUtil.GetAppSetting("Forerunner.UseMobilizerDB", true);

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

        private HttpResponseMessage GetResponseFromBytes(byte[] result, string mimeType, bool cache = false)
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
            try
            {
                IEnumerable<CatalogItem> items = GetReportManager(instance).GetItems(view, path);                
                if (items == null)
                {
                    return GetEmptyJSONResponse();
                }
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(ToString(items)), "text/JSON");
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
        }

        [HttpGet]
        public HttpResponseMessage FindItems(string folder, string searchOperator, string searchCriteria, string instance = null) 
        {
            try
            {
                CatalogItem[] matchesItems = GetReportManager(instance).FindItems(folder, searchOperator, searchCriteria);
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(ToString(matchesItems)), "text/JSON");
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
        }

        [HttpGet]
        public HttpResponseMessage ReportProperty(string path, string propertyName, string instance = null)
        {
            // This endpoint does not write to the Mobilizer DB and is therefore safe for all customers
            try
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(instance).GetItemProperty(path, propertyName)), "text/JSON");
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
        }

        public class SaveReprotPropertyPostBack{
            public string path { get; set; }
            public string properties { get; set; } 
            public string instance { get; set; }
        }

        [HttpPost]
        [ActionName("SaveReportProperty")]
        public HttpResponseMessage SaveReportProperty(SaveReprotPropertyPostBack postValue)
        {
            HttpResponseMessage resp = this.Request.CreateResponse();
            try
            { 
                GetReportManager(postValue.instance).SetProperty(postValue.path, postValue.properties);
                resp.StatusCode = HttpStatusCode.OK;
            }
            catch
            {
                resp.StatusCode = HttpStatusCode.BadRequest;
            }
            
            return resp;
        }

        [HttpGet]
        [ActionName("SaveThumbnail")]
        public HttpResponseMessage SaveThumbnail(string ReportPath, string SessionID, string instance = null)
        {
            if (UseMobilizerDB == false)
            {
                return GetNotImplementedResponse();
            }

            GetReportManager(instance).SaveThumbnail(ReportPath, SessionID);
            HttpResponseMessage resp = this.Request.CreateResponse();
            resp.StatusCode = HttpStatusCode.OK;
            return resp;
        }

        [HttpGet]
        [ActionName("Thumbnail")]
        public HttpResponseMessage Thumbnail(string ReportPath,string DefDate, string instance = null)
        {
            if (UseMobilizerDB == false)
            {
                return GetNotFoundResponse();
            }
            return GetResponseFromBytes(GetReportManager(instance).GetCatalogImage(ReportPath), "image/JPEG",true);            
        }

        [HttpGet]
        [ActionName("HasPermission")]
        public HttpResponseMessage HasPermission(string path, string permission, string instance = null)
        {
            // This endpoint does not write to the ReportServer DB and is therefore safe for all customers
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(instance).GetCatalogPermission(path, permission)), "text/JSON");
        }

        [HttpGet]
        [ActionName("Resource")]
        public HttpResponseMessage Resource(string path, string instance = null)
        {
            byte[] result = null;
            string mimetype = null;
            result = GetReportManager(instance).GetCatalogResource(path, out mimetype);
            return GetResponseFromBytes(result, mimetype);
        }

        [HttpPost]
        public HttpResponseMessage SaveResource(SetResource setResource)
        {
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(setResource.rsInstance).SaveCatalogResource(setResource)), "text/JSON");
        }

        [HttpGet]
        [ActionName("DeleteCatalogItem")]
        public HttpResponseMessage DeleteCatalogItem(string path, string instance = null)
        {
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(instance).DeleteCatalogItem(path)), "text/JSON");
        }

        [HttpGet]
        public HttpResponseMessage UpdateView(string view, string action, string path, string instance = null)
        {
            if (UseMobilizerDB == false)
            {
                return GetNotImplementedResponse();
            }
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(instance).UpdateView(view,action,path)), "text/JSON");
        }

        [HttpGet]
        public HttpResponseMessage IsFavorite(string path, string instance = null)
        {
            if (UseMobilizerDB == false)
            {
                return GetEmptyJSONResponse();
            }
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(instance).IsFavorite(path)), "text/JSON");
        }

        [HttpGet]
        public HttpResponseMessage GetUserParameters(string reportPath, string instance = null)
        {
            if (UseMobilizerDB == false)
            {
                return GetEmptyJSONResponse();
            }
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(instance).GetUserParameters(reportPath)), "text/JSON");
        }
        [HttpPost]
        public HttpResponseMessage SaveUserParameters(SaveParameters saveParams)
        {
            if (UseMobilizerDB == false)
            {
                return GetNotImplementedResponse();
            }
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(saveParams.Instance).SaveUserParameters(saveParams.reportPath, saveParams.parameters)), "text/JSON");
        }

        [HttpGet]
        public HttpResponseMessage GetUserSettings(string instance = null)
        {
            if (UseMobilizerDB == false)
            {
                return GetEmptyJSONResponse();
            }
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(instance).GetUserSettings()), "text/JSON");
        }

        public HttpResponseMessage GetUserName(string instance = null)
        {
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(instance).GetUserName()), "text/JSON");
        }

        [HttpGet]
        public HttpResponseMessage SaveUserSettings(string settings, string instance = null)
        {
            if (UseMobilizerDB == false)
            {
                return GetNotImplementedResponse();
            }
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(instance).SaveUserSettings(settings)), "text/JSON");
        }

        [HttpPost]
        public HttpResponseMessage CreateSubscription(SubscriptionInfoPostBack info)
        {
            if (UseMobilizerDB == false)
            {
                return GetNotImplementedResponse();
            }
            try
            {
                info.Report = System.Web.HttpUtility.UrlDecode(info.Report);
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(info.Instance).CreateSubscription(info)), "text/JSON");
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
        }

        [HttpGet]
        public HttpResponseMessage GetSubscription(string subscriptionID, string instance = null)
        {
            if (UseMobilizerDB == false)
            {
                return GetEmptyJSONResponse();
            }
            Forerunner.SSRS.Manager.SubscriptionInfo info = GetReportManager(instance).GetSubscription(subscriptionID);
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(ToString(info)), "text/JSON"); 
        }

        [HttpPost]
        public HttpResponseMessage UpdateSubscription(SubscriptionInfoPostBack info)
        {
            if (UseMobilizerDB == false)
            {
                return GetNotImplementedResponse();
            }
            try
            {
                GetReportManager(info.Instance).SetSubscription(info);
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(info.SubscriptionID), "text/JSON");
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
        }

        [HttpGet]
        public HttpResponseMessage DeleteSubscription(string subscriptionID, string instance = null)
        {
            if (UseMobilizerDB == false)
            {
                return GetNotImplementedResponse();
            }
            string retVal = GetReportManager(instance).DeleteSubscription(subscriptionID);
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(retVal), "text/JSON");
        }

        [HttpGet]
        public HttpResponseMessage ListSubscriptions(string reportPath, string instance = null)
        {
            if (UseMobilizerDB == false)
            {
                return GetEmptyJSONResponse();
            }
            Subscription[] subscriptions = GetReportManager(instance).ListSubscriptions(reportPath, null);
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(ToString(subscriptions)), "text/JSON"); 
        }

        [HttpGet]
        public HttpResponseMessage ListMySubscriptions(string instance = null)
        {
            Subscription[] subscriptions = GetReportManager(instance).ListMySubscriptions();
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(ToString(subscriptions)), "text/JSON");
        }

        [HttpGet]
        public HttpResponseMessage ListDeliveryExtensions(string instance = null)
        {
            if (UseMobilizerDB == false)
            {
                return GetEmptyJSONResponse();
            }
            Extension[] extensions = GetReportManager(instance).ListDeliveryExtensions();
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(ToString(extensions)), "text/JSON"); 
        }

        [HttpGet]
        public HttpResponseMessage GetExtensionSettings(string extension, string instance = null)
        {
            if (UseMobilizerDB == false)
            {
                return GetEmptyJSONResponse();
            }
            ExtensionParameter[] extensionSettings = GetReportManager(instance).GetExtensionSettings(extension);
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(ToString(extensionSettings)), "text/JSON"); 
        }

        [HttpGet]
        public HttpResponseMessage ListSchedules(string instance = null)
        {
            if (UseMobilizerDB == false)
            {
                return GetEmptyJSONResponse();
            }
            SubscriptionSchedule[] schedules = GetReportManager(instance).ListSchedules(null);
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(ToString(schedules)), "text/JSON");
        }

        [HttpGet]
        public HttpResponseMessage GetReportTags(string path, string instance = null)
        {
            if (UseMobilizerDB == false)
            {
                return GetEmptyJSONResponse();
            }

            try
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(instance).GetReportTags(path)), "text/JSON");
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
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
            if (UseMobilizerDB == false)
            {
                return GetNotImplementedResponse();
            }

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
        }

        [HttpGet]
        public HttpResponseMessage GetItemPolicies(string itemPath, string instance = null)
        {
            try
            {
                string result = GetReportManager(instance).GetItemPolicies(itemPath);
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(result), "text/JSON");
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
        }

        public class SetPolicy
        {
            public string itemPath { get; set; }
            public string policies { get; set; }
            public string instance { get; set; }
        }
        [HttpPost]
        public HttpResponseMessage SetItemPolicies(SetPolicy policy)
        {
            try
            {
                var result = GetReportManager(policy.instance).SetItemPolicies(policy.itemPath, policy.policies);
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(ToString(result)), "text/JSON");
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
        }

        [HttpGet]
        public HttpResponseMessage ListRoles(string type, string itemPath, string instance = null)
        {
            try
            {
                var result = GetReportManager(instance).ListRoles(type, itemPath);
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(ToString(result)), "text/JSON");
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
        }

        public class InheritSecurity
        {
            public string itemPath { get; set; }
            public string instance { get; set; }
        }
        [HttpPost]
        public HttpResponseMessage InheritParentSecurity(InheritSecurity inheritParent)
        {
            try
            {
                var result = GetReportManager(inheritParent.instance).InheritParentSecurity(inheritParent.itemPath);
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(ToString(result)), "text/JSON");
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
        }

        [HttpGet]
        public HttpResponseMessage GetMobilizerSetting(string instance = null)
        {
            // This endpoint does not read or write to the ReportServer DB and is therefore safe for all customers
            try
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(instance).ReadMobilizerSetting(MobilizerSettingPath)), "text/JSON");
            }
            catch (Exception ex) 
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(ex)), "text/JSON");
            }
        }

        [HttpGet]
        public HttpResponseMessage GetMobilizerVersion(string instance = null)
        {
            // This endpoint does not read or write to the ReportServer DB and is therefore safe for all customers
            try
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(instance).ReadMobilizerVersion(MobilizerVersionPath)), "text/plain");
            }
            catch (Exception ex)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(ex)), "text/JSON");
            }
        }

        [HttpGet]
        public HttpResponseMessage GetCatalog(string rootPath, bool showLinkedReport, string instance = null)
        {
            try
            {
                var catalogs = GetReportManager(instance).GetCatalog(rootPath, showLinkedReport);
                if (catalogs == null)
                {
                    return GetEmptyJSONResponse();
                }

                return GetResponseFromBytes(Encoding.UTF8.GetBytes(ToString(catalogs)), "text/JSON");
            }
            catch (Exception ex)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(ex)), "text/JSON");
            }
        }

        [HttpGet]
        public HttpResponseMessage GetReportLink(string path, string instance = null)
        {
            try
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(instance).GetReportLink(path)), "text/JSON");
            }
            catch (Exception ex)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(ex)), "text/JSON");
            }
        }

        public class SetLinkedReport
        {
            public string linkedReportPath { set; get; }
            public string newLink { set; get; }
            public string instance { set; get; }
        }
        [HttpPost]
        public HttpResponseMessage SetReportLink(SetLinkedReport linkedReport)
        {
            try
            {
                string result = GetReportManager(linkedReport.instance).SetReportLink(linkedReport.linkedReportPath, linkedReport.newLink);
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(result), "text/JSON");
            }
            catch (Exception ex)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(ex)), "text/JSON");
            }
        }
        public class LinkedReport
        {
            public string name { set; get; }
            public string parent { set; get; }
            public string link { set; get; }
            public string instance { set; get; }
        }
        [HttpPost]
        public HttpResponseMessage CreateLinkedReport(LinkedReport linkedReport)
        {
            try
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager(linkedReport.instance).CreateLinkedReport(linkedReport.name, linkedReport.parent, linkedReport.link)), "text/JSON");
            }
            catch (Exception ex)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(ex)), "text/JSON");
            }
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
