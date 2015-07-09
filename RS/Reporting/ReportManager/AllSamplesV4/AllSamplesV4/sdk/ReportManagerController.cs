using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Web;
using System.Web.Http;
using System.Text;
//using System.Web.Script.Serialization;
using System.Threading.Tasks;
using Forerunner.SSRS.Management;
using Forerunner.SSRS.Manager;
using Forerunner;
using Forerunner.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Forerunner.Security;

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
        static private bool SupportHiddenSPS = ForerunnerUtil.GetAppSetting("Forerunner.SupportHiddenSPS", true);
        static private string DefaultLoc = ConfigurationManager.AppSettings["Forerunner.DefaultLoc"];
        static private Dictionary<string, CacheData> CachedProperties = new Dictionary<string, CacheData>();
        static private string EmptyJSONObject = "{}";

        public class CacheData
        {
            public JObject LocData = null;
            public bool SPSHidden = false;
            public byte[] Tags = null;
            public bool SPSHiddenChecked = false;
            public bool LocDataChecked = false;
            public bool TagsChecked = false;
        }
        static ReportManagerController()
        {
            try
            {
                if (UseMobilizerDB)
                    ForerunnerUtil.validateConfig(ReportServerDataSource, ReportServerDB, ReportServerDBUser, ReportServerDBPWD, ReportServerDBDomain, useIntegratedSecurity, webConfigSection);
            }
            catch { }

        }

        private Forerunner.SSRS.Manager.ReportManager GetReportManager(string instance)
        {
            Forerunner.SSRS.Manager.ReportManager rm = ForerunnerUtil.GetReportManagerInstance(instance, url, IsNativeRS, DefaultUserDomain, SharePointHostName, ReportServerDataSource, ReportServerDB, ReportServerDBUser, ReportServerDBPWD, ReportServerDBDomain, useIntegratedSecurity, webConfigSection);
            
            //If you need to specify your own credentials set them here, otherwise we will the forms auth cookie or the default network credentials
            //rm.SetCredentials(new NetworkCredential("TestAccount",  "TestPWD!","Forerunner"));   
            
            //If you wish to use the service account
            //rm.SetCredentials(CredentialCache.DefaultCredentials);
            //rm.SetDomainUserName("Domain\\ServiceAccountName");

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

        private HttpResponseMessage GetDownloadResponseFromBytes(byte[] result, string mimeType, string path)
        {
            HttpResponseMessage resp = this.Request.CreateResponse();

            if (result == null || result.Length == 0)
            {
                resp.StatusCode = HttpStatusCode.NotFound;
            }
            else
            {
                string filename = GetDownloadFilename(mimeType, path);
                resp.Content = new ByteArrayContent(result); ;
                resp.Content.Headers.ContentType = new MediaTypeHeaderValue(mimeType);
                resp.Content.Headers.ContentDisposition = new ContentDispositionHeaderValue("attachment")
                {
                    FileName = filename
                };

            }

            return resp;
        }

        private string GetDownloadFilename(string mimeType, string path)
        {
            string filename = System.IO.Path.GetFileName(path);
            string ext = System.IO.Path.GetExtension(path);

            if (ext == null || ext.Length == 0)
            {
                ext = Forerunner.MimeTypeMap.GetExtension(mimeType);
            }

            return filename + ext;
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

        private void GetLocalizedNames(CatalogItem[] items, string instance)
        {
            if (DefaultLoc == null)
                return;

            
            //Get Languages            
            HttpHeaderValueCollection<StringWithQualityHeaderValue> acceptLanguage = this.Request.Headers.AcceptLanguage;
            List<string> listOfLanguages = new List<string>();
            foreach (StringWithQualityHeaderValue value in acceptLanguage)
            {
                if (value.Value != null && value.Value != "")
                    listOfLanguages.Add(value.Value.ToLower());
            }

            //if your first lang is default return
            if (listOfLanguages[0] == DefaultLoc)
                return;

            //See if there is localization data for each item
            foreach (CatalogItem c in items)
            {
                JObject ItemLoc = null;
                CacheData d = GetCacheData(c);

                if (!d.LocDataChecked)
                {                    
                    //save loc data for perf
                    string ExtProp = GetReportManager(instance).GetProperty(c.Path, "ForerunnerRDLExt");
                    if (ExtProp != null && ExtProp != "")
                    {
                        try
                        {
                            JObject o = JObject.Parse(ExtProp);
                            ItemLoc = (JObject)o["localize"];
                        }
                        catch
                        {
                        }
                        d.LocData= ItemLoc;
                    }
                    d.LocDataChecked = true;
                }

                ItemLoc = d.LocData;

                //if not loc data use default
                if (ItemLoc == null) 
                    continue;                    
                
                //get the first language that matches, if none match it will use default
                foreach (string l in listOfLanguages)
                {                    
                    if ( l == DefaultLoc)
                        break;
                    if (ItemLoc[l] != null)
                    {
                        c.LocalizedName = (string)ItemLoc[l]["name"];
                        c.LocalizedDescription =  (string)ItemLoc[l]["description"];
                        break;
                    }
                }          

            }
        }

        private CacheData GetCacheData(CatalogItem ci)
        {
            //if not found return empty
            if (ci == null)
                return new CacheData();

            string key = ci.ID + (Math.Round(ci.ModifiedDate.Ticks / 1000000000000d, 0) * 1000000000000).ToString();

            if (!CachedProperties.ContainsKey(key))
                CachedProperties.Add(key,new CacheData());
            
            return CachedProperties[key];    
        }
        private void GetSharePointHidden(CatalogItem[] items, string instance)
        {
            if (IsNativeRS || !SupportHiddenSPS)
                return;

            //See if SharePoint Item is hidden
            foreach (CatalogItem c in items)
            {
                CacheData d = GetCacheData(c);
                
                if (!d.SPSHiddenChecked)
                {
                    //save for perf                    
                    string PropHidden = GetReportManager(instance).GetProperty(c.Path, "ForerunnerHidden");
                    bool hidden = c.Hidden;
                    bool.TryParse(PropHidden, out hidden);                    
                    d.SPSHidden = hidden;
                    d.SPSHiddenChecked = true;
                }
                c.Hidden = d.SPSHidden;
            }
        }

        /// <summary>
        /// GetItems will return a collection of catalog items based upon the given view string
        /// and path.
        /// </summary>
        /// <param name="view">View: "catalog", "recent", "favorites" or "searchfolder"</param>
        /// <param name="path">Folder path. Used when the view is either "catalog" or "searchfolder"</param>
        /// <param name="instance">Instance name</param>
        /// <returns>JSON object that contains a CatalogItem array, E.g.,
        /// [{
        ///   "LocalizedName": null,
        ///   "LocalizedDescription": null,
        ///   "ID": "6211fb02-9662-4ef9-8dc6-b1236b722fe7",
        ///   "Name": "AdventureWorks 2008 Sample Reports",
        ///   "Path": "/AdventureWorks 2008 Sample Reports",
        ///   "VirtualPath": null,
        ///   "Type": 1,
        ///   "Size": 0,
        ///   "SizeSpecified": false,
        ///   "Description": null,
        ///   "Hidden": false,
        ///   "HiddenSpecified": false,
        ///   "CreationDate": "\/Date(1404870950527)\/",
        ///   "CreationDateSpecified": true,
        ///   "ModifiedDate": "\/Date(1429580966090)\/",
        ///   "ModifiedDateSpecified": true,
        ///   "CreatedBy": "jonto-i7\\Jon",
        ///   "ModifiedBy": "JONTO-I7\\TestAccount",
        ///   "MimeType": null,
        ///   "ExecutionDate": "\/Date(-62135568000000)\/",
        ///   "ExecutionDateSpecified": false
        ///},
        ///{
        ///   "LocalizedName": null,
        ///   "LocalizedDescription": null,
        ///   "ID": "f8118cba-c72b-4027-8cc7-dbc45fe45909",
        ///   "Name": "AdventureWorks 2008R2",
        ///   "Path": "/AdventureWorks 2008R2",
        ///   "VirtualPath": null,
        ///   "Type": 1,
        ///   "Size": 0,
        ///   "SizeSpecified": false,
        ///   "Description": null,
        ///   "Hidden": false,
        ///   "HiddenSpecified": false,
        ///   "CreationDate": "\/Date(1404870634657)\/",
        ///   "CreationDateSpecified": true,
        ///   "ModifiedDate": "\/Date(1404870637327)\/",
        ///   "ModifiedDateSpecified": true,
        ///   "CreatedBy": "jonto-i7\\Jon",
        ///   "ModifiedBy": "jonto-i7\\Jon",
        ///   "MimeType": null,
        ///   "ExecutionDate": "\/Date(-62135568000000)\/",
        ///   "ExecutionDateSpecified": false
        ///}]
        ///</returns>
        [HttpGet]
        public HttpResponseMessage GetItems(string view, string path, string instance = null)
        {
            try
            {
                CatalogItem[] items = null;
                ImpersonateCaller.RunAsCurrentUser(() =>
                 {
                     items = GetReportManager(instance).GetItems(view, path);
                 });

                GetLocalizedNames(items,instance);
                GetSharePointHidden(items, instance);
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

        /// <summary>
        /// FindItems will return an array of CatalogItems based upon the given search criteria
        /// </summary>
        /// <param name="folder">Folder path, null will default to "/"</param>
        /// <param name="searchOperator">Defaults to "or" unless "and" is passed</param>
        /// <param name="searchCriteria">A JSON object. E.g., {"SearchCriteria":[{"Key":"Name","Value":"search value"},{"Key":"Description","Value":"search value"}]}</param>
        /// <param name="instance"></param>
        /// <returns>JSON object that contains a CatalogItem array</returns>
        [HttpGet]
        public HttpResponseMessage FindItems(string folder, string searchOperator, string searchCriteria, string instance = null) 
        {
            try
            {
                CatalogItem[] matchesItems = null;
                ImpersonateCaller.RunAsCurrentUser(() =>
                 {
                     matchesItems = GetReportManager(instance).FindItems(folder, searchOperator, searchCriteria);
                 });
                GetLocalizedNames(matchesItems,instance);
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(ToString(matchesItems)), "text/JSON");
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
        }

        /// <summary>
        /// ReportProperty will return back a list of property values based on the given property names
        /// </summary>
        /// <param name="path">Respource path</param>
        /// <param name="propertyName">Comma delimited list of property names. E.g., "Hidden,Description,ForerunnerRDLExt,Name"</param>
        /// <param name="instance"></param>
        /// <returns>JSON object. E.g., {"Hidden":"False","Name":"jonto"}</returns>
        [HttpGet]
        public HttpResponseMessage ReportProperty(string path, string propertyName, string instance = null)
        {
            // This endpoint does not write to the Mobilizer DB and is therefore safe for all customers
            try
            {
                string prop = null;
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    prop = GetReportManager(instance).GetItemProperty(path, propertyName);
                });
                
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(prop), "text/JSON");
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

        /// <summary>
        /// SaveReportProperty will save the properties to the given report path
        /// </summary>
        /// <param name="postValue">Body parameters</param>
        /// <returns>JSON Object</returns>
        [HttpPost]
        [ActionName("SaveReportProperty")]
        public HttpResponseMessage SaveReportProperty(SaveReprotPropertyPostBack postValue)
        {
            HttpResponseMessage resp = this.Request.CreateResponse();
            try
            {
                string result = null;
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    result = GetReportManager(postValue.instance).SetProperty(postValue.path, postValue.properties);
                });
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(result), "text/JSON");
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }

        }

        /// <summary>
        /// SaveThumbnail will cause a thumbnail to be generated and saved for the given report path. The UseMobilizerDB
        /// configuration option must be set to true in order to use SaveThumbnail.
        /// </summary>
        /// <param name="ReportPath">Report path</param>
        /// <param name="SessionID">Current Session ID</param>
        /// <param name="instance"></param>
        /// <returns>Status OK</returns>
        [HttpGet]
        [ActionName("SaveThumbnail")]
        public HttpResponseMessage SaveThumbnail(string ReportPath, string SessionID, string instance = null)
        {
            if (UseMobilizerDB == false)
            {
                return GetNotImplementedResponse();
            }

            try
            {
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    GetReportManager(instance).SaveThumbnail(ReportPath, SessionID);
                });

            }
            catch { }

            HttpResponseMessage resp = this.Request.CreateResponse();
            resp.StatusCode = HttpStatusCode.OK;
            return resp;
        }

        /// <summary>
        /// Thumbnail will return the requested thumbnail image (I.e. "image/JPEG") 
        /// </summary>
        /// <param name="ReportPath">Report path</param>
        /// <param name="DefDate">not used</param>
        /// <param name="instance"></param>
        /// <returns>"image/JPEG"</returns>
        [HttpGet]
        [ActionName("Thumbnail")]
        public HttpResponseMessage Thumbnail(string ReportPath,string DefDate, string instance = null)
        {
            if (UseMobilizerDB == false)
            {
                return GetNotFoundResponse();
            }

            byte[] retval = null;
            try
            {
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval = GetReportManager(instance).GetCatalogImage(ReportPath);
                });
            }
            catch { }

            return GetResponseFromBytes(retval, "image/JPEG",true);            
        }

        /// <summary>
        /// HasPermission will return a JSON object that defines the given permission settings
        /// </summary>
        /// <param name="path">Resource path</param>
        /// <param name="permission">Comma delimited list of permissions. E.g., "Create Resource,Update Properties,Update Security Policies,Create Report,Create Folder"</param>
        /// <param name="instance"></param>
        /// <returns>JSON object. E.g., 
        /// {
        ///     "Create Resource":true,
        ///     "Update Properties":true,
        ///     "Update Security Policies":true,
        ///     "Create Report":true,
        ///     "Create Folder":true
        /// }
        /// </returns>
        [HttpGet]
        [ActionName("HasPermission")]
        public HttpResponseMessage HasPermission(string path, string permission, string instance = null)
        {
            // This endpoint does not write to the ReportServer DB and is therefore safe for all customers
            string retval = null;
            try
            {
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval = GetReportManager(instance).GetCatalogPermission(path, permission);
                });
            }
            catch { }
            
            
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(retval), "text/JSON");
        }

        /// <summary>
        /// Resource returns the requested resource in the default mime type for that object.
        /// for instance if you store a .pdf file in SSRS the mime type would be "application/pdf"
        /// </summary>
        /// <param name="path">Resource path</param>
        /// <param name="instance"></param>
        /// <returns>Object of the default mime type, E.g., "application/pdf"</returns>
        [HttpGet]
        [ActionName("Resource")]
        public HttpResponseMessage Resource(string path, string instance = null)
        {
            byte[] result = null;
            string mimetype = null;
            try
            {
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    result = GetReportManager(instance).GetCatalogResource(path, out mimetype);
                });
            }
            catch { }
            return GetResponseFromBytes(result, mimetype);
        }

        /// <summary>
        /// DownloadFile will download the given resource using the default mime type
        /// </summary>
        /// <param name="path">Resource / report path</param>
        /// <param name="itemtype">CatalogItem item type</param>
        /// <param name="instance"></param>
        /// <returns>Object of the default mime type. E.g., "xml/forerunner-report"</returns>
        [HttpGet]
        [ActionName("DownloadFile")]
        public HttpResponseMessage DownloadFile(string path, string itemtype, string instance = null)
        {
            byte[] result = null;
            string mimetype = null;
            try
            {
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    result = GetReportManager(instance).GetCatalogContents(path, itemtype, out mimetype);
                });
            }
            catch { }
            
            return GetDownloadResponseFromBytes(result, mimetype, path);
        }

        /// <summary>
        /// SaveResource will save the given resource defined by the setResource object
        /// </summary>
        /// <param name="setResource"></param>
        /// <returns>JSON object indicating status</returns>
        [HttpPost]
        public HttpResponseMessage SaveResource(SetResource setResource)
        {
            try
            {
                byte[] retval = null;
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                   retval= Encoding.UTF8.GetBytes(GetReportManager(setResource.rsInstance).SaveCatalogResource(setResource));
                });
                return GetResponseFromBytes(retval, "text/JSON");
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
        }

        [HttpGet]
        [ActionName("DeleteCatalogItem")]
        public HttpResponseMessage DeleteCatalogItem(string path, string safeFolderDelete, string instance = null)
        {
            byte[] retval = null;
            try
            {
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval = Encoding.UTF8.GetBytes(GetReportManager(instance).DeleteCatalogItem(path, safeFolderDelete));
                });
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
            return GetResponseFromBytes(retval, "text/JSON");
        }

        [HttpGet]
        public HttpResponseMessage UpdateView(string view, string action, string path, string instance = null)
        {
            if (UseMobilizerDB == false)
            {
                return GetNotImplementedResponse();
            }

            byte[] retval = null;
            try
            {
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval = Encoding.UTF8.GetBytes(GetReportManager(instance).UpdateView(view,action,path));
                });
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
            return GetResponseFromBytes(retval, "text/JSON");
            
        }

        [HttpGet]
        public HttpResponseMessage IsFavorite(string path, string instance = null)
        {
            if (UseMobilizerDB == false)
            {
                return GetEmptyJSONResponse();
            }
            byte[] retval = null;
            try
            {
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval = Encoding.UTF8.GetBytes(GetReportManager(instance).IsFavorite(path));
                });
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
            return GetResponseFromBytes(retval, "text/JSON");
            
        }

        [HttpGet]
        public HttpResponseMessage GetUserParameters(string reportPath, string instance = null)
        {
            if (UseMobilizerDB == false)
            {
                return GetEmptyJSONResponse();
            }
            
            byte[] retval = null;
            try
            {
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval = Encoding.UTF8.GetBytes(GetReportManager(instance).GetUserParameters(reportPath));
                });
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
            return GetResponseFromBytes(retval, "text/JSON");
        }

        [HttpPost]
        public HttpResponseMessage SaveUserParameters(SaveParameters saveParams)
        {
            if (UseMobilizerDB == false)
            {
                return GetNotImplementedResponse();
            }

            byte[] retval = null;
            try
            {
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval =Encoding.UTF8.GetBytes(GetReportManager(saveParams.Instance).SaveUserParameters(saveParams.reportPath, saveParams.parameters));
                });
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
            return GetResponseFromBytes(retval, "text/JSON");
        }

        [HttpGet]
        public HttpResponseMessage GetUserSettings(string instance = null)
        {
            if (UseMobilizerDB == false)
            {
                return GetEmptyJSONResponse();
            }

            byte[] retval = null;
            try
            {
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval = Encoding.UTF8.GetBytes(GetReportManager(instance).GetUserSettings());
                });
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
            return GetResponseFromBytes(retval, "text/JSON");
        }

        public HttpResponseMessage GetUserName(string instance = null)
        {
            byte[] retval = null;
            try
            {
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval = Encoding.UTF8.GetBytes(GetReportManager(instance).GetUserName());
                });
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
            return GetResponseFromBytes(retval, "text/JSON");
       }

        [HttpGet]
        public HttpResponseMessage SaveUserSettings(string settings, string instance = null)
        {
            if (UseMobilizerDB == false)
            {
                return GetNotImplementedResponse();
            }

            byte[] retval = null;
            try
            {
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval = Encoding.UTF8.GetBytes(GetReportManager(instance).SaveUserSettings(settings));
                });
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
            return GetResponseFromBytes(retval, "text/JSON");
            
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
                byte[] retval = null;
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval = Encoding.UTF8.GetBytes(GetReportManager(info.Instance).CreateSubscription(info));
                });
                return GetResponseFromBytes(retval, "text/JSON");
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

            Forerunner.SSRS.Manager.SubscriptionInfo info = null;
            try
            {
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                     info = GetReportManager(instance).GetSubscription(subscriptionID);
                });
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
            
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

            byte[] retval = null;
            try
            {
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval = Encoding.UTF8.GetBytes(GetReportManager(instance).DeleteSubscription(subscriptionID));
                });
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
            return GetResponseFromBytes(retval, "text/JSON");
    
        }

        [HttpGet]
        public HttpResponseMessage ListSubscriptions(string reportPath, string instance = null)
        {
            if (UseMobilizerDB == false)
            {
                return GetEmptyJSONResponse();
            }

            byte[] retval = null;
            try
            {
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval = Encoding.UTF8.GetBytes(ToString(GetReportManager(instance).ListSubscriptions(reportPath, null)));
                });
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
            return GetResponseFromBytes(retval, "text/JSON");
        }

        [HttpGet]
        public HttpResponseMessage ListMySubscriptions(string instance = null)
        {

            byte[] retval = null;
            try
            {
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval = Encoding.UTF8.GetBytes(ToString(GetReportManager(instance).ListMySubscriptions()));
                });
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
            return GetResponseFromBytes(retval, "text/JSON");
        }

        [HttpGet]
        public HttpResponseMessage ListDeliveryExtensions(string instance = null)
        {
            if (UseMobilizerDB == false)
            {
                return GetEmptyJSONResponse();
            }

            byte[] retval = null;
            try
            {
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval = Encoding.UTF8.GetBytes(ToString(GetReportManager(instance).ListDeliveryExtensions()));
                });
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
            return GetResponseFromBytes(retval, "text/JSON");
        }

        [HttpGet]
        public HttpResponseMessage GetExtensionSettings(string extension, string instance = null)
        {
            if (UseMobilizerDB == false)
            {
                return GetEmptyJSONResponse();
            }

            byte[] retval = null;
            try
            {
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval = Encoding.UTF8.GetBytes(ToString(GetReportManager(instance).GetExtensionSettings(extension)));
                });
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
            return GetResponseFromBytes(retval, "text/JSON");          
        }

        [HttpGet]
        public HttpResponseMessage ListSchedules(string instance = null)
        {
            if (UseMobilizerDB == false)
            {
                return GetEmptyJSONResponse();
            }

            byte[] retval = null;
            try
            {
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval = Encoding.UTF8.GetBytes(ToString(GetReportManager(instance).ListSchedules(null)));
                });
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
            return GetResponseFromBytes(retval, "text/JSON");
        }

        [HttpGet]
        public HttpResponseMessage GetReportTags(string path, string instance = null)
        {
            if (UseMobilizerDB == false || path == "/")
            {
                return GetEmptyJSONResponse();
            }

            try
            {
                CacheData d = GetCacheData(GetReportManager(instance).GetItem(  path));
                
                if (!d.TagsChecked)
                {
                    ImpersonateCaller.RunAsCurrentUser(() =>
                    {
                        d.Tags = Encoding.UTF8.GetBytes(GetReportManager(instance).GetReportTags(path));
                    });
                    d.TagsChecked = true;
                }
                return GetResponseFromBytes(d.Tags, "text/JSON");
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
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    GetReportManager(postValue.instance).SaveReportTags(postValue.reportTags, postValue.path);
                });
                
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
                string result = null;
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    result = GetReportManager(instance).GetItemPolicies(itemPath);
                });
                
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

                byte[] retval = null;
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval = Encoding.UTF8.GetBytes(GetReportManager(policy.instance).SetItemPolicies(policy.itemPath, policy.policies));
                });                
                return GetResponseFromBytes(retval, "text/JSON");
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
                byte[] retval = null;
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval = Encoding.UTF8.GetBytes(ToString(GetReportManager(instance).ListRoles(type, itemPath)));
                });
                return GetResponseFromBytes(retval, "text/JSON");
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
                byte[] retval = null;
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval = Encoding.UTF8.GetBytes(ToString(GetReportManager(inheritParent.instance).InheritParentSecurity(inheritParent.itemPath)));
                });
                return GetResponseFromBytes(retval, "text/JSON");
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
                byte[] retval = null;
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval = Encoding.UTF8.GetBytes(GetReportManager(instance).ReadMobilizerSetting(MobilizerSettingPath));
                });
                return GetResponseFromBytes(retval, "text/JSON");
            }
            catch (Exception ) 
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes("{}"), "text/JSON");
            }
        }

        [HttpGet]
        public HttpResponseMessage GetMobilizerVersion(string instance = null)
        {
            // This endpoint does not read or write to the ReportServer DB and is therefore safe for all customers
            try
            {
                byte[] retval = null;
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval = Encoding.UTF8.GetBytes(GetReportManager(instance).ReadMobilizerVersion(MobilizerVersionPath));
                });
                return GetResponseFromBytes(retval, "text/JSON");

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
                byte[] retval = null;
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval = Encoding.UTF8.GetBytes(ToString(GetReportManager(instance).GetCatalog(rootPath, showLinkedReport)));
                });
                return GetResponseFromBytes(retval, "text/JSON");
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
                byte[] retval = null;
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval = Encoding.UTF8.GetBytes(GetReportManager(instance).GetReportLink(path));
                });
                return GetResponseFromBytes(retval, "text/JSON");
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
                byte[] retval = null;
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval = Encoding.UTF8.GetBytes(GetReportManager(linkedReport.instance).SetReportLink(linkedReport.linkedReportPath, linkedReport.newLink));
                });
                return GetResponseFromBytes(retval, "text/JSON");
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
                byte[] retval = null;
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval = Encoding.UTF8.GetBytes(GetReportManager(linkedReport.instance).CreateLinkedReport(linkedReport.name, linkedReport.parent, linkedReport.link));
                });
                return GetResponseFromBytes(retval, "text/JSON");
            }
            catch (Exception ex)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(ex)), "text/JSON");
            }
        }
        [HttpPost]
        public HttpResponseMessage NewFolder(NewFolderData data)
        {
            try
            {
                byte[] retval = null;
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval = Encoding.UTF8.GetBytes(GetReportManager(data.instance).NewFolder(data));
                });
                return GetResponseFromBytes(retval, "text/JSON");

            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
        }
        [HttpPost]
        public HttpResponseMessage UploadFile()
        {
            if (!Request.Content.IsMimeMultipartContent())
            {
                throw new HttpResponseException(Request.CreateResponse(HttpStatusCode.NotAcceptable, "This request is not properly formatted"));
            }

            UploadFileData data = new UploadFileData();

            var provider = new MultipartMemoryStreamProvider();
            var readPartsTask = System.Threading.Tasks.Task.Run(async () => { await Request.Content.ReadAsMultipartAsync(provider); });
            readPartsTask.Wait();

            foreach (StreamContent streamContent in provider.Contents)
            {
                string name = streamContent.Headers.ContentDisposition.Name.ToLower().Replace("\"", "");
                data.setResource.overwrite = false;

                string content = "";
                if (name != "file")
                {
                    var readStringTask = System.Threading.Tasks.Task.Run<string>(async () => { return await streamContent.ReadAsStringAsync(); });
                    readStringTask.Wait();
                    content = readStringTask.Result;
                }

                switch (name)
                {
                    case "overwrite":
                        if (content == "on")
                        {
                            data.setResource.overwrite = true;
                        }
                        break;
                    case "file":
                        var readFileTask = System.Threading.Tasks.Task.Run<byte []>(async () => { return await streamContent.ReadAsByteArrayAsync(); });
                        readFileTask.Wait();
                        data.setResource.contentsUTF8 = readFileTask.Result;
                        break;
                    case "filename":
                        data.filename = content;
                        break;
                    case "parentfolder":
                        data.setResource.parentFolder = content;
                        break;
                    case "rsinstance":
                        if (content != "null")
                        {
                            data.setResource.rsInstance = content;
                        }
                        break;
                }
            }

            try
            {
                byte[] retval = null;
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval = Encoding.UTF8.GetBytes(GetReportManager(data.setResource.rsInstance).UploadFile(data));
                });
                return GetResponseFromBytes(retval, "text/JSON");
            }
            catch (ArgumentException e)
            {
                if (e.ParamName == "overwrite")
                {
                    return Request.CreateErrorResponse(HttpStatusCode.BadRequest, e);
                }
                throw e;
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/html");
            }
        }

        [HttpPost]
        public HttpResponseMessage MoveItem(MoveItemData data)
        {
            try
            {
                byte[] retval = null;
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval = Encoding.UTF8.GetBytes(GetReportManager(data.instance).MoveItem(data));
                });
                return GetResponseFromBytes(retval, "text/JSON");

            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
        }

        [HttpGet]
        public HttpResponseMessage GetDBConfig(string instance = null)
        {
            try
            {
                byte[] retval = null;
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval = Encoding.UTF8.GetBytes(GetReportManager(instance).GetDBConfiguration());
                });
                return GetResponseFromBytes(retval, "text/JSON");                
            }
            catch
            {
                return GetEmptyJSONResponse();
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
