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

        [System.ComponentModel.DefaultValue(null)]
        public string UserName { get; set; } 
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
            
            // If using SSRS custom authentication
            //rm.rs.LogonUser("CustomUserName", "CustomerPassword", "CustomAuthority or NULL");

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
                    try
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
                            d.LocData = ItemLoc;
                        }
                        d.LocDataChecked = true;
                    }
                    catch
                    {
                        Logger.Trace(LogType.Warning, "Error getting ForerunnerRDLExt");
                    }
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

            string key = ci.ID + ci.ModifiedDate.Ticks.ToString();

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

                try
                {
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
                catch
                {
                    Logger.Trace(LogType.Warning, "Error getting property ForerunnerHidden");
                }
            }
        }

        /// <summary>
        /// GetItems will return an array of catalog items based upon the given view string
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
        /// <param name="postValue">JSON object</param>
        /// <returns>JSON object</returns>
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
        /// SaveThumbnail will cause a thumbnail to be generated and saved for the given report path. Requires the
        /// UseMobilizerDB configuration option.
        /// </summary>
        /// <param name="ReportPath">Report path</param>
        /// <param name="SessionID">Current Session ID</param>
        /// <param name="instance"></param>
        /// <returns>Status OK (I.e., 200)</returns>
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
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }

            HttpResponseMessage resp = this.Request.CreateResponse();
            resp.StatusCode = HttpStatusCode.OK;
            return resp;
        }

        /// <summary>
        /// Thumbnail will return the requested thumbnail image (I.e. "image/JPEG"). Requires the
        /// UseMobilizerDB configuration option.
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
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }

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
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
            
            
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
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
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
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
            
            return GetDownloadResponseFromBytes(result, mimetype, path);
        }

        /// <summary>
        /// SaveResource will save the given resource defined by the setResource object
        /// </summary>
        /// <param name="setResource">JSON object</param>
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

        /// <summary>
        /// Will delete the catalog item define by path from the database.
        /// </summary>
        /// <param name="path">Path of the item to delete</param>
        /// <param name="safeFolderDelete">"true" to delete folders that have children</param>
        /// <param name="instance"></param>
        /// <returns>JSON object indicating status</returns>
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

        /// <summary>
        /// Adds or deletes a report / resource from the favorites view. Requires the
        /// UseMobilizerDB configuration option.
        /// </summary>
        /// <param name="view">Must be "favorites"</param>
        /// <param name="action">"add" or "delete"</param>
        /// <param name="path">Path of the report / resource to add or delete from the favaorites view</param>
        /// <param name="instance"></param>
        /// <returns>JSON object indicating status</returns>
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

        /// <summary>
        /// Tests if the given report / resource is contained in the favorites view. Requires the
        /// UseMobilizerDB configuration option.
        /// </summary>
        /// <param name="path">Report / resource path</param>
        /// <param name="instance"></param>
        /// <returns>JSON object</returns>
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

        /// <summary>
        /// Returns any named parameter sets for the given reportPath and user. Requires the
        /// UseMobilizerDB configuration option.
        /// </summary>
        /// <param name="reportPath">Report path</param>
        /// <param name="instance"></param>
        /// <returns>JSON object that contains any named parameter sets. E.g.,
        ///{
        ///   "canEditAllUsersSet": true,
        ///   "defaultSetId": "08cd351a-a0df-3e1c-d158-d5ee090f8ad7",
        ///   "parameterSets": {
        ///     "08cd351a-a0df-3e1c-d158-d5ee090f8ad7": {
        ///       "isAllUser": false,
        ///       "name": "Default",
        ///       "id": "08cd351a-a0df-3e1c-d158-d5ee090f8ad7",
        ///       "data": {
        ///         "ParamsList": [
        ///           {
        ///             "Parameter": "StartDate",
        ///             "IsMultiple": "false",
        ///             "Type": "DateTime",
        ///             "Value": "2002-01-01",
        ///             "UseDefault": null
        ///           },
        ///           {
        ///             "Parameter": "EndDate",
        ///             "IsMultiple": "false",
        ///             "Type": "DateTime",
        ///             "Value": "2003-12-31",
        ///             "UseDefault": null
        ///           }
        ///         ]
        ///       }
        ///     },
        ///     "66512c24-826d-6090-fef9-4a11b9db9bf2": {
        ///       "name": "Second Named Set",
        ///       "id": "66512c24-826d-6090-fef9-4a11b9db9bf2",
        ///       "data": {
        ///         "ParamsList": [
        ///           {
        ///             "Parameter": "StartDate",
        ///             "IsMultiple": "false",
        ///             "Type": "DateTime",
        ///             "Value": "2002-01-01",
        ///             "UseDefault": null
        ///           },
        ///           {
        ///             "Parameter": "EndDate",
        ///             "IsMultiple": "false",
        ///             "Type": "DateTime",
        ///             "Value": "2003-12-07",
        ///             "UseDefault": null
        ///           }
        ///         ]
        ///       },
        ///       "isAllUser": false
        ///     }
        ///   }
        /// }
        /// </returns>
        [HttpGet]
        public HttpResponseMessage GetUserParameters(string reportPath, string instance = null, string userName = null)
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
                    retval = Encoding.UTF8.GetBytes(GetReportManager(instance).GetUserParameters(reportPath,userName));
                });
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
            return GetResponseFromBytes(retval, "text/JSON");
        }

        /// <summary>
        /// Saves the given named parameter sets. Requires the
        /// UseMobilizerDB configuration option.
        /// </summary>
        /// <param name="saveParams">JSON object</param>
        /// <returns>JSON object indicating status</returns>
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
                    retval =Encoding.UTF8.GetBytes(GetReportManager(saveParams.Instance).SaveUserParameters(saveParams.reportPath, saveParams.parameters,saveParams.UserName));
                });
            }
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
            return GetResponseFromBytes(retval, "text/JSON");
        }       

        /// <summary>
        /// Returns the user settings for the current user. Requires the
        /// UseMobilizerDB configuration option.
        /// </summary>
        /// <param name="instance"></param>
        /// <returns>JSON object that contains the user setting. E.g.,
        /// {
        ///   "responsiveUI": false,
        ///   "adminUI": true,
        ///   "email": "",
        ///   "viewStyle": "large"
        /// }
        /// </returns>
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
            catch (Exception )
            {
                return GetEmptyJSONResponse();
                //return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }
            return GetResponseFromBytes(retval, "text/JSON");
        }

        /// <summary>
        /// Returns the current user name
        /// </summary>
        /// <param name="instance"></param>
        /// <returns>Current user name in text</returns>
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

        /// <summary>
        /// Saves the given user settings. Requires the
        /// UseMobilizerDB configuration option.
        /// </summary>
        /// <param name="settings">JSON object. E.g., {"responsiveUI":true,"adminUI":true,"email":"","viewStyle":"large"}</param>
        /// <param name="instance"></param>
        /// <returns>JSON object indicating status</returns>
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

        /// <summary>
        /// Creates an email subscription. Requires the
        /// UseMobilizerDB configuration option.
        /// </summary>
        /// <param name="info">JSON object</param>
        /// <returns>JSON object indicating status</returns>
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

        /// <summary>
        /// Returns the subscription information based upon the given subscription id. Requires the
        /// UseMobilizerDB configuration option.
        /// </summary>
        /// <param name="subscriptionID">Subscription ID</param>
        /// <param name="instance"></param>
        /// <returns>JSON object containing the requested subscription. E.g.,
        /// {
        ///   "SubscriptionID": "d174a766-2063-44f2-a440-1003f7538848",
        ///   "Report": null,
        ///   "ExtensionSettings": {
        ///     "Extension": "Report Server Email",
        ///     "ParameterValues": [
        ///       {
        ///         "Name": "TO",
        ///         "Value": "TestAccount",
        ///         "Label": null
        ///       },
        ///       {
        ///         "Name": "Subject",
        ///         "Value": "@ReportName was executed at @ExecutionTime",
        ///         "Label": null
        ///       },
        ///       {
        ///         "Name": "IncludeLink",
        ///         "Value": "True",
        ///         "Label": null
        ///       },
        ///       {
        ///         "Name": "IncludeReport",
        ///         "Value": "True",
        ///         "Label": null
        ///       },
        ///       {
        ///         "Name": "RenderFormat",
        ///         "Value": "MHTML",
        ///         "Label": null
        ///       }
        ///     ]
        ///   },
        ///   "Description": "Send email to TestAccount",
        ///   "EventType": "TimedSubscription",
        ///   "SubscriptionSchedule": {
        ///     "Name": null,
        ///     "ScheduleID": "cb4656d7-f5bb-4a63-8b6f-82bd8c9300c2",
        ///     "MatchData": "\u003c?xml version=\"1.0\" encoding=\"utf-16\" standalone=\"yes\"?\u003e\u003cScheduleDefinition xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\u003e\u003cStartDateTime xmlns=\"http://schemas.microsoft.com/sqlserver/2005/06/30/reporting/reportingservices\"\u003e2013-12-30T02:00:00.000-08:00\u003c/StartDateTime\u003e\u003cWeeklyRecurrence xmlns=\"http://schemas.microsoft.com/sqlserver/2005/06/30/reporting/reportingservices\"\u003e\u003cWeeksInterval\u003e1\u003c/WeeksInterval\u003e\u003cDaysOfWeek\u003e\u003cSunday\u003etrue\u003c/Sunday\u003e\u003cMonday\u003etrue\u003c/Monday\u003e\u003cTuesday\u003etrue\u003c/Tuesday\u003e\u003cWednesday\u003etrue\u003c/Wednesday\u003e\u003cThursday\u003etrue\u003c/Thursday\u003e\u003cFriday\u003etrue\u003c/Friday\u003e\u003cSaturday\u003etrue\u003c/Saturday\u003e\u003c/DaysOfWeek\u003e\u003c/WeeklyRecurrence\u003e\u003c/ScheduleDefinition\u003e",
        ///     "IsMobilizerSchedule": false
        ///   },
        ///   "Parameters": [
        ///     {
        ///       "Name": "MultipleValues",
        ///       "Value": "1",
        ///       "Label": null
        ///     },
        ///     {
        ///       "Name": "MultipleValues",
        ///       "Value": "2",
        ///       "Label": null
        ///     },
        ///     {
        ///       "Name": "FloatTest",
        ///       "Value": "1",
        ///       "Label": null
        ///     },
        ///     {
        ///       "Name": "ProductName",
        ///       "Value": "Chai",
        ///       "Label": null
        ///     },
        ///     {
        ///       "Name": "IsCheap",
        ///       "Value": null,
        ///       "Label": null
        ///     },
        ///     {
        ///       "Name": "ReportParameter1",
        ///       "Value": null,
        ///       "Label": null
        ///     },
        ///     {
        ///       "Name": "IntegerTest",
        ///       "Value": null,
        ///       "Label": null
        ///     },
        ///     {
        ///       "Name": "CategoryID",
        ///       "Value": "1",
        ///       "Label": null
        ///     },
        ///     {
        ///       "Name": "ProductionDate",
        ///       "Value": "2014-12-01",
        ///       "Label": null
        ///     }
        ///   ]
        /// }
        /// </returns>
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

        /// <summary>
        /// Updated the subscription based upon the given info parameter. Requires the
        /// UseMobilizerDB configuration option.
        /// </summary>
        /// <param name="info">JSON object</param>
        /// <returns>JSON object indicating status</returns>
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

        /// <summary>
        /// Delete the subscription defined by the subscription id. Requires the
        /// UseMobilizerDB configuration option.
        /// </summary>
        /// <param name="subscriptionID">Subscription id</param>
        /// <param name="instance"></param>
        /// <returns>JSON object indicating status</returns>
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

        /// <summary>
        /// Returns a list of subscriptions for the given report path and current user. Requires the
        /// UseMobilizerDB configuration option.
        /// </summary>
        /// <param name="reportPath">Report Path</param>
        /// <param name="instance"></param>
        /// <returns>JSON object containing the subscription information</returns>
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

        /// <summary>
        /// Returns a list of subscriptions for the current user
        /// </summary>
        /// <param name="instance"></param>
        /// <returns>JSON object the contains the subscription information</returns>
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

        /// <summary>
        /// Returns an array of delivery extensions. Requires the
        /// UseMobilizerDB configuration option.
        /// </summary>
        /// <param name="instance"></param>
        /// <returns>JSON array of delivery extension. E.g.,
        /// [
        ///   {
        ///     "ExtensionType": 0,
        ///     "Name": "Report Server FileShare",
        ///     "LocalizedName": "Windows File Share",
        ///     "Visible": true,
        ///     "IsModelGenerationSupported": false
        ///   },
        ///   {
        ///     "ExtensionType": 0,
        ///     "Name": "Report Server Email",
        ///     "LocalizedName": "E-Mail",
        ///     "Visible": true,
        ///     "IsModelGenerationSupported": false
        ///   },
        ///   {
        ///     "ExtensionType": 0,
        ///     "Name": "NULL",
        ///     "LocalizedName": "Null Delivery Provider",
        ///     "Visible": true,
        ///     "IsModelGenerationSupported": false
        ///   }
        /// ]
        /// </returns>
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

        /// <summary>
        /// Returns the extension settings based upon the given extension. Requires the
        /// UseMobilizerDB configuration option.
        /// </summary>
        /// <param name="extension">Extension name</param>
        /// <param name="instance"></param>
        /// <returns>JSON object that contains the settings</returns>
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

        /// <summary>
        /// Returns a list of subscription schedules. Requires the
        /// UseMobilizerDB configuration option.
        /// </summary>
        /// <param name="instance"></param>
        /// <returns>JSON array of schedules</returns>
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

        /// <summary>
        /// Returns any / all tags that have been associated with the given report,
        /// resource or folder path. Requires the UseMobilizerDB configuration option.
        /// </summary>
        /// <param name="path">Report, resource or folder path</param>
        /// <param name="instance"></param>
        /// <returns>JSON object containing the tags. E.g.,
        /// {
        ///   "Tags": [
        ///     "\"Products\"",
        ///     "\"DocMap\""
        ///   ]
        /// }
        /// </returns>
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

        /// <summary>
        /// Saves the given report tags back to the database. Requires the
        /// UseMobilizerDB configuration option.
        /// </summary>
        /// <param name="postValue">JSON object</param>
        /// <returns>Status code (E.g., 200 for OK)</returns>
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
            catch (Exception e)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(e)), "text/JSON");
            }

            return resp;
        }

        /// <summary>
        /// Returns the security policies for the given itemPath
        /// </summary>
        /// <param name="itemPath">Item path</param>
        /// <param name="instance"></param>
        /// <returns>JSON object containing the policies. E.g.,
        /// {
        ///   "isInheritParent": true,
        ///   "policyArr": [
        ///     {
        ///       "GroupUserName": "BUILTIN\\Administrators",
        ///       "Roles": [
        ///         {
        ///           "Name": "Content Manager",
        ///           "Description": ""
        ///         }
        ///       ]
        ///     },
        ///     {
        ///       "GroupUserName": "jonto-i7\\Jon",
        ///       "Roles": [
        ///         {
        ///           "Name": "Browser",
        ///           "Description": ""
        ///         },
        ///         {
        ///           "Name": "Content Manager",
        ///           "Description": ""
        ///         }
        ///       ]
        ///     }
        ///   ]
        /// }
        /// </returns>
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

        /// <summary>
        /// Sets the security polices for the given itemPath
        /// </summary>
        /// <param name="policy">JSON object</param>
        /// <returns>JSON object indicating status</returns>
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

        /// <summary>
        /// Returns an array of security roles 
        /// </summary>
        /// <param name="type">"Catalog"</param>
        /// <param name="itemPath">Report, Folder or resource path</param>
        /// <param name="instance"></param>
        /// <returns>
        /// [
        ///   {
        ///     "Name": "Browser",
        ///     "Description": "May view folders, reports and subscribe to reports."
        ///   },
        ///   {
        ///     "Name": "Content Manager",
        ///     "Description": "May manage content in the Report Server.  This includes folders, reports and resources."
        ///   },
        ///   {
        ///     "Name": "My Reports",
        ///     "Description": "May publish reports and linked reports; manage folders, reports and resources in a users My Reports folder."
        ///   },
        ///   {
        ///     "Name": "Publisher",
        ///     "Description": "May publish reports and linked reports to the Report Server."
        ///   },
        ///   {
        ///     "Name": "Report Builder",
        ///     "Description": "May view report definitions."
        ///   }
        /// ]
        /// </returns>
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

        /// <summary>
        /// Returns the inherited security from the parent
        /// </summary>
        /// <param name="inheritParent">JSON object</param>
        /// <returns>JSON object containing the security settings</returns>
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

        /// <summary>
        /// Returns the Mobilizer settings defined via the file referenced in the configuration appSettings
        /// "Forerunner.MobilizerSettingPath"
        /// </summary>
        /// <param name="instance"></param>
        /// <returns>JSON object with the settings. E.g., 
        ///  {
        /// 	"MaxBigDropdownItem": 50,
        /// 	"MinItemToEnableBigDropdownOnTouch": 20,
        /// 	"EnableCascadingTree": "on",
        /// 	"MaxResponsiveResolution": 1280,
        /// 	"FullScreenPageNavSize" : 768,
        /// 	"DefaultResponsiveTablix" : "on",
        /// 	"FirefoxPDFbug":"on",
        /// 	"ParameterPaneWidth":"350",
        /// 	"showHomeButton":"off",
        /// 	"showSubscriptionUI":"on",
        /// 	"FancyTooltips":"on",
        /// 	"ImageAreaHighligh": "on",
        /// 	"ImageAreaHighlighBorderColor": "0000ff",
        /// 	"ImageAreaHighlighBorderWidth": "2",
        /// 	"HideDisabledTool":"on",
        /// 	"WatermarkPostText":"",
        /// 	"DefaultSubscriptionFormat":"MHTML",
        /// 	"URLActionNewTab": "off",
        /// 	"Debug":"off",
        /// 	"SubscriptionInputSize":"50",
        /// 	"ManageSubscriptionUI":"default",
        /// 	"EnableGestures":"on",
        /// 	"BigTablixBatchSize":3000,
        /// 	"AppleFixedToolbarBug":"on",
        /// 	"DefaultViewStyle":"list"
        /// }
        /// </returns>
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

        /// <summary>
        /// Returns the current Mobilizer version number
        /// </summary>
        /// <param name="instance"></param>
        /// <returns>Version number in text format</returns>
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

        /// <summary>
        /// Returns the requested loc file
        /// </summary>
        /// <param name="LocFile"></param>
        /// <param name="instance"></param>
        /// <returns>Returns the requested loc file</returns>
        [HttpGet]
        [AllowAnonymous]
        public HttpResponseMessage GetMobilizerLocFile(string LocFile,string instance = null)
        {
            // This endpoint does not read or write to the ReportServer DB and is therefore safe for all customers
            try
            {
                byte[] retval = null;
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    retval = GetReportManager(instance).ReadMobilizerLocFile(LocFile);
                });
                return GetResponseFromBytes(retval, "text/JSON");

            }
            catch (Exception ex)
            {
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(JsonUtility.WriteExceptionJSON(ex)), "text/JSON");
            }
        }

        /// <summary>
        /// Returns back the entire catalog (so this can be expensive). It is usefully when presenting a dialog
        /// where the user can select a report such as the Link Report feature.
        /// </summary>
        /// <param name="rootPath">Root path to start the search</param>
        /// <param name="showLinkedReport">"true" or "false"</param>
        /// <param name="instance"></param>
        /// <returns>
        /// {
        ///   "children": [
        ///     {
        ///       "children": [
        ///         {
        ///           "children": null,
        ///           "Name": "Company Sales 2008",
        ///           "Path": "/AdventureWorks 2008 Sample Reports/Company Sales 2008",
        ///           "Type": 2
        ///         },
        ///         {
        ///           "children": null,
        ///           "Name": "Employee Sales Summary 2008",
        ///           "Path": "/AdventureWorks 2008 Sample Reports/Employee Sales Summary 2008",
        ///           "Type": 2
        ///         }
        ///       ],
        ///       "Name": "AdventureWorks 2008 Sample Reports",
        ///       "Path": "/AdventureWorks 2008 Sample Reports",
        ///       "Type": 1
        ///     }
        ///   ],
        ///   "Name": "/",
        ///   "Path": "/",
        ///   "Type": 1
        /// }
        /// </returns>
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

        /// <summary>
        /// Returns the actual path of the original report given a linked report path
        /// </summary>
        /// <param name="path">Linked report path</param>
        /// <param name="instance"></param>
        /// <returns>JSON object that contains the actual path. E.g.,
        /// {
        ///     "linkedReport":"/AdventureWorks 2008 Sample Reports/Company Sales 2008"
        /// }
        /// </returns>
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

        /// <summary>
        /// Sets the actual report path, i.e., newLink, for a linked report, 
        /// i.e., linkedReportPath
        /// </summary>
        /// <param name="linkedReport">JSON object</param>
        /// <returns>JSON object indicating status</returns>
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

        /// <summary>
        /// Creates a new linked report
        /// </summary>
        /// <param name="linkedReport">JSON object</param>
        /// <returns>JSON object indicating status</returns>
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

        /// <summary>
        /// Creates a new folder with the given properties
        /// </summary>
        /// <param name="data">JSON object</param>
        /// <returns>JSON object indicating status</returns>
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

        /// <summary>
        /// Uploads the given file to the server. This method accepts a Post request with
        /// enctype: "multipart/form-data". The multiparts are: file, filename, overwrite,
        /// parentfolder and rsinstance. Mobilizer using the jQuery ajaxForm plugin to
        /// help format the request properly.
        /// </summary>
        /// <returns>JSON object indicating status</returns>
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

        /// <summary>
        /// Moves the curFullPath to the newFullPath
        /// </summary>
        /// <param name="data">JSON object</param>
        /// <returns>JSON object indicating status</returns>
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

        /// <summary>
        /// Returns a subset of Mobilizer appSettings as a JSON object
        /// </summary>
        /// <param name="instance"></param>
        /// <returns>JSON object which contains a subset of the appSettings. E.g.,
        /// {
        ///     "UseMobilizerDB":true,
        ///     "SeperateDB":false
        /// }
        /// </returns>
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
