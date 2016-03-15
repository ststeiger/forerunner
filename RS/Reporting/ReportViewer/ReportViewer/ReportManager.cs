using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Net;
using System.Web;
using System.Data.SqlClient;
using Forerunner;
using Forerunner.SSRS.Viewer;
using Forerunner.SSRS.Management;
using Forerunner.Security;
using Forerunner.Logging;
using Forerunner.Subscription;
using Forerunner.JSONWriter;
using System.Threading;
using System.Web.Security;
using System.Security.Principal;
using System.Xml;
using System.IO;
using System.Xml.Serialization;
using Forerunner.SSRS;
using System.Configuration;

namespace Forerunner.SSRS.Manager
{
    public class SetResource
    {
        public string resourceName { get; set; }
        public string parentFolder { get; set; }
        public string contents { get; set; }
        public byte [] contentsUTF8 { get; set; }
        public string mimetype { get; set; }
        public string rsInstance { get; set; }
        public bool overwrite { get; set; }
    }

    public class UploadFileData
    {
        public SetResource setResource;
        public string filename;

        public UploadFileData()
        {
            setResource = new SetResource();
        }
    }

    public class NewFolderData
    {
        public string parentFolder { set; get; }
        public string folderName { set; get; }
        public string folderDecsription { set; get; }
        public string hidden { set; get; }
        public string instance { set; get; }
    }

    public class SiteCatalog
    {
        public string Name { get; set; }
        public string Path { get; set; }
        public ItemTypeEnum Type { get; set; }
        public List<SiteCatalog> children = null;
    }

    public class MoveItemData
    {
        public string curFullPath { get; set; }
        public string newFullPath { get; set; }
        public string instance { set; get; }
    }

    /// <summary>
    /// This is the proxy class that would call RS to get the data
    /// </summary>
    public class ReportManager : IDisposable
    {
        RSManagementProxy rs;
        Credentials WSCredentials;
        Credentials DBCredentials;
        bool useIntegratedSecurity;
        bool IsNativeRS = true;
        string URL;        
        string DefaultUserDomain = null;
        string SharePointHostName = null;
        SqlConnection SQLConn;
        static bool RecurseFolders = ForerunnerUtil.GetAppSetting("Forerunner.RecurseFolders", false);
        static bool QueueThumbnails = ForerunnerUtil.GetAppSetting("Forerunner.QueueThumbnails", false);
        static bool UseMobilizerDB = ForerunnerUtil.GetAppSetting("Forerunner.UseMobilizerDB", true);
        static bool SeperateDB = ForerunnerUtil.GetAppSetting("Forerunner.SeperateDB", false);
        static string SharePointSites = ConfigurationManager.AppSettings["Forerunner.SharePointSites"];
        static private Dictionary<string, SSRSServer> SSRSServers = new Dictionary<string, SSRSServer>();
        static string MobilizerSetting = string.Empty;
        static string VersionNumber = string.Empty;
        private static readonly object SettingLockObj = new object();
        private static readonly object VersionLockObj = new object();
        static private List<string> ThumbnailsInProcess = new List<string>();
        private static readonly IDictionary<string, string> _hiddenExtensionsMap = new Dictionary<string, string>(StringComparer.InvariantCultureIgnoreCase) 
        {
            {".frdb", null},
            {".frsf", null},
            {".rdl", null},
            {".smdl", null},
            {".rsd", null},
        };
        private static readonly IDictionary<string, ItemTypeEnum> _extensionToItemTypeMap = new Dictionary<string, ItemTypeEnum>(StringComparer.InvariantCultureIgnoreCase) 
        {
            {".rdl", ItemTypeEnum.Report},
            {".smdl", ItemTypeEnum.Model},
            {".rsd", ItemTypeEnum.DataSource},
        };

        private class SSRSServer
        {
            public bool isSchemaChecked = false;

        }

        private SSRSServer GetServerInfo()
        {
            SSRSServer retval = null;

            lock (SSRSServers)
            {
                SSRSServers.TryGetValue(this.URL, out retval);

                if (retval == null)
                    retval = LoadServerData();
            }
            return retval;
        }
        private SSRSServer LoadServerData()
        {
            SSRSServer retval = new SSRSServer();
            SSRSServers.Add(this.URL, retval);
            return retval;
        }

        private static bool isForerunnerDB(SqlConnection conn, Credentials DBCredentials)
        {
            string SQL = "SELECT * FROM sysobjects WHERE name = 'ForerunnerDBVersion'";
            Impersonator impersonator = null;
            try
            {
                impersonator = tryImpersonate(DBCredentials);
                conn.Open();
                using (SqlCommand cmd = new SqlCommand(SQL, conn))
                {
                    SqlDataReader rdr = cmd.ExecuteReader();
                    if (!rdr.Read())
                    {
                        conn.Close();
                        Logger.Trace(LogType.Error, "Not a Forerunner database for connectionString " + conn.ConnectionString);
                        return false;
                    }
                    conn.Close();
                }
            }
            catch (SqlException e)
            {
                Logger.Trace(LogType.Error, "An exception happened while validating the Forerunner database.  Connection string: " + conn.ConnectionString);
                ExceptionLogGenerator.LogException(e);
                return false;
            }
            finally
            {
                if (impersonator != null)
                {
                    impersonator.Dispose();
                }
                if (conn.State == System.Data.ConnectionState.Open)
                {
                    conn.Close();
                }
            }
            return true;
        }

        private static bool isReportServerDB(SqlConnection conn, Credentials DBCredentials)
        {
            string SQL = "SELECT * FROM sysobjects WHERE name = 'ExecutionLogStorage'";
            Impersonator impersonator = null;
            try
            {
                impersonator = tryImpersonate(DBCredentials);
                conn.Open();
                using (SqlCommand cmd = new SqlCommand(SQL, conn))
                {
                    SqlDataReader rdr = cmd.ExecuteReader();
                    if (!rdr.Read())
                    {
                        conn.Close();
                        Logger.Trace(LogType.Error, "Not a report server database for connectionString " + conn.ConnectionString);
                        return false;
                    }
                    conn.Close();
                }
            }
            catch (SqlException e)
            {
                Logger.Trace(LogType.Error, "An exception happened while validating the report server database.  Connection string: " + conn.ConnectionString);
                ExceptionLogGenerator.LogException(e);
                return false;
            }
            finally {
                if (impersonator != null)
                {
                    impersonator.Dispose();
                }
                if (conn.State == System.Data.ConnectionState.Open) {
                    conn.Close();
                }
            }
            return true;
        }

        public static bool ValidateConfig(string ReportServerDataSource, string ReportServerDB, Credentials DBCredentials, bool useIntegratedSecurity, bool isRSDB = true)
        {
            if (!UseMobilizerDB || ReportServerDataSource == null)
            {
                return true;
            }
            SqlConnectionStringBuilder builder = new SqlConnectionStringBuilder();
            builder.DataSource = ReportServerDataSource;
            builder.InitialCatalog = ReportServerDB;
            if (useIntegratedSecurity)
            {
                builder.IntegratedSecurity = true;
            }
            else if (DBCredentials.UserName != null && DBCredentials.Password !=null)
            {
                builder.UserID = DBCredentials.UserName;
                String Password = DBCredentials.encrypted ? Security.Encryption.Decrypt(DBCredentials.Password) : DBCredentials.Password;
                builder.Password = Password;
            }


            SqlConnection conn = new SqlConnection(builder.ConnectionString);

            if (isRSDB && ReportManager.isReportServerDB(conn, DBCredentials))
            {
                Logger.Trace(LogType.Info, "Validation of the report server database succeeded.");
                return true;
            }
            else if (!isRSDB && ReportManager.isForerunnerDB(conn, DBCredentials))
            {
                Logger.Trace(LogType.Info, "Validation of the Forerunner database succeeded.");
                return true;
            }
            else
            {
                Logger.Trace(LogType.Error, "Validation of the report server database  failed.");
                return false;
            }
       
        }

        public ReportManager(string URL, Credentials WSCredentials, string ReportServerDataSource, string ReportServerDB, Credentials DBCredentials, bool useIntegratedSecurity, bool IsNativeRS, string DefaultUserDomain, string SharePointHostName = null)
        {
            rs = new RSManagementProxy(IsNativeRS);
            this.DefaultUserDomain = DefaultUserDomain;
            this.SharePointHostName = SharePointHostName;
            this.IsNativeRS = IsNativeRS;
            this.WSCredentials = WSCredentials;
            this.useIntegratedSecurity = useIntegratedSecurity;
            this.DBCredentials = DBCredentials;
            rs.Url = URL;
            this.URL = URL;

            if (ReportServerDataSource == null)
                UseMobilizerDB = false;

            rs.Credentials = WSCredentials == null ? null : new NetworkCredential(WSCredentials.UserName, WSCredentials.Password, WSCredentials.Domain);

            if (UseMobilizerDB)
            {
                SqlConnectionStringBuilder builder = new SqlConnectionStringBuilder();
                builder.DataSource = ReportServerDataSource;
                builder.InitialCatalog = ReportServerDB;
                if (useIntegratedSecurity)
                {
                    builder.IntegratedSecurity = true;
                }
                else if (DBCredentials.UserName != null && DBCredentials.Password !=null)
                {

                    builder.UserID = DBCredentials.UserName;
                    String Password = DBCredentials.encrypted ? Security.Encryption.Decrypt(DBCredentials.Password) : DBCredentials.Password;
                    builder.Password = Password;
                }


                SQLConn = new SqlConnection(builder.ConnectionString);
                
            }
        }

        public void SetCredentials(Credentials Credentials)
        {
            if (Credentials != null)
            {
                rs.Credentials = new NetworkCredential(Credentials.UserName, Credentials.Password, Credentials.Domain);
            }
        }

        public string UpdateView(string view, string action, string path)
        {

            if (view == "favorites")
            {
                if (action == "delete")
                    return this.DeleteFavorite(path);
                else if (action == "add")
                    return this.SaveFavorite(path);
            }

            return null;
        }

        public CatalogItem[] GetItems(string view, string path)
        {
            if (view == "favorites")
                return this.GetFavorites();
            else if (view == "recent")
                return this.GetRecentReports();
            else if (view == "catalog")
                return this.ListChildren(path, false);
            else if (view == "searchfolder")
                return this.GetSearchFolderItems(path);
            else
                return null;
        }

        public CatalogItem[] FindItems(string folder,string searchOperator, string searchCriteria, bool showAll = false, bool showHidden = false)
        {
            //specify search area, default to search global
            string searchArea = folder == null ? "/" : folder;
            //default search operator to or
            Management.BooleanOperatorEnum oper = Management.BooleanOperatorEnum.Or;

            if (searchOperator == "and")
            {
                oper = Management.BooleanOperatorEnum.And;
            }

            rs.Credentials = GetCredentials();
            List<CatalogItem> list = new List<CatalogItem>();
            CatalogItem[] catalogItems = rs.FindItems(searchArea, oper, JsonUtility.getNativeSearchCondition(searchCriteria));

            foreach (CatalogItem catalog in catalogItems)
            {
                if ((catalog.Type == ItemTypeEnum.Folder || catalog.Type == ItemTypeEnum.Report || catalog.Type == ItemTypeEnum.Resource || showAll) && (!catalog.Hidden || showHidden))
                {
                    list.Add(catalog);
                }
            }

            return list.ToArray();
        }

        private ICredentials credentials = null;
        public void SetCredentials(ICredentials credentials)
        {
            this.credentials = credentials;
        }

        private ICredentials GetCredentials()
        {
            if (credentials != null)
                return credentials;

            return FormsAuthenticationHelper.GetCredentials();
        }

        private string DomainUserName = null;
        public void SetDomainUserName(string NewUserName)
        {
            DomainUserName = NewUserName;
        }
        // This must NOT be called when impersonated in the SQL Impersonator block.  This must be called on the web thread!
        private String GetDomainUserName()
        {
            if (DomainUserName != null)
                return DomainUserName;

            if (credentials != null)
            {
                System.Net.NetworkCredential networkCredential = (System.Net.NetworkCredential)credentials;
                return networkCredential.UserName;
            }
            else if (AuthenticationMode.GetAuthenticationMode() == System.Web.Configuration.AuthenticationMode.Forms)
            {
                HttpCookie authCookie = HttpContext.Current.Request.Cookies[FormsAuthentication.FormsCookieName];
                FormsAuthenticationTicket authTicket = FormsAuthentication.Decrypt(authCookie.Value);
                return authTicket.Name;
            }

            return HttpContext.Current.User.Identity.Name;
        }

        private CatalogItem[] callListChildren(string path, Boolean isRecursive)
        {
            rs.Credentials = GetCredentials();
            return rs.ListChildren(path,isRecursive);
        }

        private void OpenSQLConn(bool CheckOnConnect = true)
        {
            if (CheckOnConnect)
                CheckSchema();
            if (SQLConn.State != System.Data.ConnectionState.Open)
            {
                SQLConn.Open();
            }
        }

        private void CloseSQLConn()
        {
            if (SQLConn.State == System.Data.ConnectionState.Open)
            {
                SQLConn.Close();
            }
        }

        private Property[] callGetProperties(string path, Property[] props)
        {
            // Please review this call stack.
            // This call is already in the impersonated context
            // No need to impersonate again.
            rs.Credentials = GetCredentials();

            return rs.GetProperties(path, props);
        }
        private void callSetProperties(string path, Property[] props)
        {
            // Please review this call stack.
            // This call is already in the impersonated context
            // No need to impersonate again.
            rs.Credentials = GetCredentials();

             rs.SetProperties(path, props);
        }

        private string[] callGetPermissions(string path)
        {
            rs.Credentials = GetCredentials();
            return rs.GetPermissions(path);
        }

        private ItemTypeEnum GetItemType(string path)
        {
            rs.Credentials = GetCredentials();
            return rs.GetItemType(path);
        }
        private void SetMissingResourceExtension(ref string path, string mimetype)
        {
            if (!Path.HasExtension(path) && mimetype != null && mimetype.Length > 0 && !IsNativeRS)
            {
                string extension = MimeTypeMap.GetExtension(mimetype);
                path += extension;
            }
        }
        private void SetMissingMimetype(string path, ref string mimetype)
        {
            if (mimetype == null && Path.HasExtension(path))
            {
                mimetype = MimeTypeMap.GetMimeType(Path.GetExtension(path));
            }
        }
        public byte[] GetCatalogResource(string path, out string mimetype)
        {
            rs.Credentials = GetCredentials();
            byte[] contents = rs.GetResourceContents(path, out mimetype);
            SetMissingMimetype(path, ref mimetype);

            return contents;
        }
        public String DeleteCatalogItem(string path, string saveFolderDelete)
        {
            bool needFolderCheck = Convert.ToBoolean(saveFolderDelete);

            if (needFolderCheck == true && GetItemType(path) == ItemTypeEnum.Folder)
            {
                var items = callListChildren(path, false);
                if (items.Length != 0)
                {
                    string warningMsg = "folderNotEmpty";
                    return getReturnWarning(warningMsg);
                }
            }

            rs.Credentials = GetCredentials();
            rs.DeleteItem(path);
            return getReturnSuccess();
        }
        public byte[] GetReportDefinition(string path, out string mimetype)
        {
            mimetype = "xml/forerunner-report";
            return rs.GetReportDefinition(path);
        }
        public byte[] GetCatalogContents(string path, string itemtype, out string mimetype)
        {
            rs.Credentials = GetCredentials();

            ItemTypeEnum type = (ItemTypeEnum)Convert.ToInt32(itemtype);
            switch (type)
            {
                case ItemTypeEnum.Resource:
                    return GetCatalogResource(path, out mimetype);
                case ItemTypeEnum.Report:
                    return GetReportDefinition(path, out mimetype);
            }

            throw new Exception("Unsupported catalog item type");
        }
        private string GetResourceName(string filename)
        {
            string ext = Path.GetExtension(filename);
            if (_hiddenExtensionsMap.ContainsKey(ext))
            {
                return Path.GetFileNameWithoutExtension(filename);
            }

            return filename;
        }
        private string getCheckWarningsReturn(Warning[] warnings)
        {
            if (warnings.Length > 0)
            {
                return getReturnWarning(warnings[0].Message);
            }

            return getReturnSuccess();
        }
        public string SetReportDefinition(string report, UploadFileData data)
        {
            // Note that any warnings are purposefully ignored here. That is because it errantly reports that
            // Data Sets could not be hooked up and in the case of a report where the dataset is already hooked
            // up this warning is wrong.
            rs.SetReportDefinition(data.setResource.parentFolder + "/" + report, data.setResource.contentsUTF8);
            return getReturnSuccess();
        }
        public string CreateReport(string report, UploadFileData data)
        {
            Warning[] warnings = null;
            try
            {
                warnings = rs.CreateReport(
                    report,                         // Report name
                    data.setResource.parentFolder,  // Parent folder
                    data.setResource.overwrite,     // Overwrite flag
                    data.setResource.contentsUTF8,  // Definition
                    null);                          // Properties
            }
            catch (System.Web.Services.Protocols.SoapException e)
            {
                bool notFound = String.Compare(e.Detail["HttpStatus"].InnerText, "400", true) == 0;
                if (notFound)
                {
                    throw new ArgumentException("Resource already exists:" + report, "overwrite");
                }
                throw e;
            }

            return getCheckWarningsReturn(warnings);
        }
        public String UploadReport(UploadFileData data)
        {
            rs.Credentials = GetCredentials();

            string report = Path.GetFileNameWithoutExtension(data.filename);
            if (IsNativeRS == false)
            {
                // SharePoint requires the file extension
                report = data.filename;
            }

            var condition = new Management.SearchCondition();
            condition.Condition = Management.ConditionEnum.Equals;
            condition.Name = "Name";
            condition.Value = report;
            Management.SearchCondition[] conditions = new Management.SearchCondition[1];
            conditions[0] = condition;
            CatalogItem[] catalogItems = rs.FindItems(data.setResource.parentFolder, Management.BooleanOperatorEnum.And, conditions);

            if (catalogItems == null || catalogItems.Length == 0)
            {
                // No existing report
                return CreateReport(report, data);
            }
            else if (data.setResource.overwrite)
            {
                // Report exists so they better ask to overwrite
                return SetReportDefinition(report, data);
            }

            throw new ArgumentException("Resource already exists:" + report, "overwrite");
        }
        public String UploadFile(UploadFileData data)
        {
            ItemTypeEnum type;
            string ext = Path.GetExtension(data.filename);
            if (!_extensionToItemTypeMap.TryGetValue(ext, out type))
            {
                type = ItemTypeEnum.Resource;
            }
            switch (type)
            {
                case ItemTypeEnum.Resource:
                    data.setResource.resourceName = GetResourceName(data.filename);
                    data.setResource.mimetype = Forerunner.MimeTypeMap.GetMimeType(Path.GetExtension(data.filename));
                    return SaveCatalogResource(data.setResource);
                case ItemTypeEnum.Report:
                    return UploadReport(data);
            }

            throw new Exception(String.Format("Unsupported file type: {0}", ext));
        }
        public String NewFolder(NewFolderData data)
        {
            rs.Credentials = GetCredentials();

            Property [] properties = new Property[2];
            Property description = new Property();
            description.Name = "Description";
            description.Value = data.folderDecsription;
            properties[0] = description;
            Property hidden = new Property();
            hidden.Name = "Hidden";
            hidden.Value = String.Compare(data.hidden, "on", true) == 0 ? "True" : "False";
            properties[1] = hidden;

            rs.CreateFolder(data.folderName, data.parentFolder, properties);
            return getReturnSuccess();
        }
        private string getSaveCatalogResourceSuccess(string resourceName)
        {
            JSONTextWriter w = new JSONTextWriter();
            w.WriteStartObject();
            w.WriteMember("Status");
            w.WriteString("Success");
            w.WriteMember("ResourceName");
            w.WriteString(resourceName);
            w.WriteEndObject();
            return w.ToString();
        }

        public String SaveCatalogResource(SetResource setResource)
        {
            bool invalidItemName = false;
            bool notFound = false;
            rs.Credentials = GetCredentials();
            byte[] contentUTF8 = setResource.contentsUTF8 != null ? setResource.contentsUTF8 : Encoding.UTF8.GetBytes(setResource.contents);

            string resourceName = setResource.resourceName;
            SetMissingResourceExtension(ref resourceName, setResource.mimetype);
            setResource.resourceName = resourceName;

            Property[] props = null;
            
            //if SPS need to set mimetype as property
            if (!IsNativeRS)
            {
                props = new Property[1];
                props[0] = new Property();
                props[0].Name = "mimetype";
                props[0].Value = setResource.mimetype;
            }

            if (!setResource.overwrite)
            {
                try
                {
                    // If we were not told to overwrite then try and create the resource here
                    rs.CreateResource(setResource.resourceName,
                                        setResource.parentFolder,
                                        setResource.overwrite,
                                        contentUTF8,
                                        setResource.mimetype,
                                        props);
                    return getSaveCatalogResourceSuccess(resourceName);
                }
                catch (System.Web.Services.Protocols.SoapException e)
                {
                    invalidItemName = String.Compare(e.Detail["ErrorCode"].InnerText, "rsInvalidItemName", true) == 0;
                    if (invalidItemName)
                    {
                        throw new ArgumentException("Invalid resource name:" + setResource.resourceName);
                    }
                    notFound = String.Compare(e.Detail["HttpStatus"].InnerText, "400", true) == 0;
                    if (!notFound)
                    {
                        throw e;
                    }
                }
                throw new ArgumentException("Resource already exists:" + setResource.resourceName, "overwrite");
            }

            try
            {
                // If we were told to overwrite, replace the contents here. We assume the resource exists 
                var path = CombinePaths(setResource.parentFolder, setResource.resourceName);
                path = GetPath(path);
                rs.SetResourceContents(path, contentUTF8, setResource.mimetype);
            }
            catch (System.Web.Services.Protocols.SoapException e)
            {
                invalidItemName = String.Compare(e.Detail["ErrorCode"].InnerText, "rsInvalidItemName", true) == 0;
                if (invalidItemName)
                {
                    throw new ArgumentException("Invalid resource name:" + setResource.resourceName, ", name");
                }
                notFound = String.Compare(e.Detail["HttpStatus"].InnerText, "400", true) == 0;
                if (!notFound)
                {
                    throw e;
                }
            }
            if (notFound)
            {
                // If the resource does not exist yet we need to create it here
                rs.CreateResource(setResource.resourceName,
                                    setResource.parentFolder,
                                    setResource.overwrite,
                                    contentUTF8,
                                    setResource.mimetype,
                                    props);
            }

            return getSaveCatalogResourceSuccess(resourceName);
        }

        public CatalogItem[] ListChildren(string path, Boolean isRecursive = false, bool showAll = false, bool showHidden = true)
        {
            Logger.Trace(LogType.Info, "ListChildren:  Path=" + path);
            List<CatalogItem> list = new List<CatalogItem>();
            CatalogItem[] items = callListChildren(path, isRecursive);
            bool added = false;

            foreach (CatalogItem ci in items)
            {
                string mimetype = ci.MimeType;
                SetMissingMimetype(ci.Path, ref mimetype);
                ci.MimeType = mimetype;

                added = false;
                if ((ci.Type == ItemTypeEnum.Report || ci.Type == ItemTypeEnum.Resource || ci.Type == ItemTypeEnum.LinkedReport || showAll) && (!ci.Hidden || showHidden))
                {
                    list.Add(ci);
                    added = true;
                }
                if (RecurseFolders)
                {
                    if ((ci.Type == ItemTypeEnum.Folder || ci.Type == ItemTypeEnum.Site) && (!ci.Hidden || showHidden) && !added)
                    {
                        CatalogItem[] folder = callListChildren(ci.Path, false);

                        foreach (CatalogItem fci in folder)
                        {
                            if (fci.Type == ItemTypeEnum.Report || fci.Type == ItemTypeEnum.Folder || fci.Type == ItemTypeEnum.Site || fci.Type == ItemTypeEnum.Resource || fci.Type == ItemTypeEnum.LinkedReport || showAll)
                            {
                                if (!ci.Hidden || showHidden)
                                {
                                    list.Add(ci);
                                    added = true;
                                    break;
                                }
                            }
                        }
                        if (!added)
                        {
                            // We mark this as hidden here because it will show up in the admin view and be hidden in the normal view
                            ci.Hidden = true;
                            list.Add(ci);
                            added = true;
                        }
                    }
                }
                else if ((ci.Type == ItemTypeEnum.Folder || ci.Type == ItemTypeEnum.Site || showAll) && (!ci.Hidden || showHidden) && !added)
                {
                    list.Add(ci);
                }


            }
            return list.ToArray();
        }

        private static Impersonator tryImpersonate(Credentials DBCredentials)
        {
            if (DBCredentials.SecurityType != Credentials.SecurityTypeEnum.Integrated)
                return null;

            String Password = DBCredentials.encrypted ? Security.Encryption.Decrypt(DBCredentials.Password) : DBCredentials.Password;
            Impersonator impersonator = new Impersonator(DBCredentials.UserName, DBCredentials.Domain, Password);
            impersonator.Impersonate();
            return impersonator;
        }

        private Impersonator tryImpersonate(bool doNotCallImpersonate = false) 
        {
            if (!useIntegratedSecurity) return null;

            String Password = DBCredentials.encrypted ? Security.Encryption.Decrypt(DBCredentials.Password) : DBCredentials.Password;
            Impersonator impersonator = new Impersonator(DBCredentials.UserName, DBCredentials.Domain, Password);

            if (!doNotCallImpersonate)
                impersonator.Impersonate();
            return impersonator;
        }


        void CheckSchema()
        {
            //Moved to CreateDB, to be called from config tool.

            string version = "no version";
            if (GetServerInfo().isSchemaChecked)
                return;

            if (UseMobilizerDB == false)
                return;

            Impersonator impersonator = null;
            try
            {
                impersonator = tryImpersonate();

                string SQL = @"IF EXISTS(SELECT * FROM sysobjects where name = 'ForerunnerDBVersion')
                                SELECT  Version, PreviousVersion  FROM ForerunnerDBVersion  
                              ELSE
                                SELECT Verion = 'No Mobilizer Schema Installed'
                            ";

                OpenSQLConn(false);

                using (SqlCommand SQLComm = new SqlCommand(SQL, SQLConn))
                {

                    using (SqlDataReader SQLReader = SQLComm.ExecuteReader())
                    {
                        while (SQLReader.Read())
                        {
                            version = SQLReader.GetString(0);
                            if (version == "S.1.3" || version == "1.4")
                                continue;
                            else
                            {
                                string errStr = "Incorrect DB Schema!  <br />Expected 1.4 or S.1.3  <br /><br />Found <br />" + version + "<br /><br />Please use the configuration tool to install or update the Mobilizer Schema.";
                                ExceptionLogGenerator.LogException(errStr,"CheckSchema");
                                throw new Exception(errStr);
                            }
                        }
                    }

                    GetServerInfo().isSchemaChecked = true;
                }
            }
            finally
            {
                if (impersonator != null)
                {
                    impersonator.Dispose();
                }
                CloseSQLConn();
            }
        }

        public string SaveFavorite(string path)
        {
            string IID = GetItemID(path);
            Impersonator impersonator = null;
            string userName = GetDomainUserName();
            try
            {
                impersonator = tryImpersonate();
                string SQL = @" DECLARE @UID uniqueidentifier
                            
                            SELECT @UID = (SELECT  TOP 1 UserID FROM Users WHERE (UserName = @UserName OR UserName = @DomainUser))
                            IF NOT EXISTS (SELECT * FROM ForerunnerFavorites WHERE UserID = @UID AND ItemID = @IID)
                            BEGIN
	                            INSERT ForerunnerFavorites (ItemID, UserID,SPSPath) SELECT @IID,@UID,@ItemPath
                            END";

                if (SeperateDB)
                    SQL = @" IF NOT EXISTS (SELECT * FROM ForerunnerFavorites WHERE UserID = @DomainUser AND ItemID = @ItemPath)
                            BEGIN
	                            INSERT ForerunnerFavorites (ItemID, UserID) SELECT @ItemPath,@DomainUser
                            END";

                OpenSQLConn();
                using (SqlCommand SQLComm = new SqlCommand(SQL, SQLConn))
                {
                    SetUserNameParameters(SQLComm, userName);
                    SQLComm.Parameters.AddWithValue("@ItemPath",path);
                    SQLComm.Parameters.AddWithValue("@IID", IID);                    
                    SQLComm.ExecuteNonQuery();
                }

                //Need to try catch and return error
                return getReturnSuccess();
            }
            finally
            {
                if (impersonator != null)
                {
                    impersonator.Dispose();
                }
                CloseSQLConn();
            }
        }

        public string SaveUserParameters(string path, string parameters,string userName = null)
        {
            bool canEditAllUsersSet = HasPermission(path, "Update Parameters");
            ParameterModel model = ParameterModel.parse(parameters, ParameterModel.AllUser.KeepDefinition, canEditAllUsersSet);

            string userParameters = model.GetUserParameters(ParameterModel.GeneratedFields.Exclude);
            string returnValue = SaveUserParamatersInternal(path, userParameters, userName);
            if (returnValue.IndexOf("Success", StringComparison.InvariantCultureIgnoreCase) == -1)
            {
                return returnValue;
            }

            if (canEditAllUsersSet)
            {
                string allUserParameters = model.GetAllUserParameters(ParameterModel.GeneratedFields.Exclude);
                returnValue = SaveAllUserParamaters(path, allUserParameters);
            }

            return returnValue;
        }

        private string SaveAllUserParamaters(string path, string parameters)
        {
            string IID = GetItemID(path);
            Impersonator impersonator = null;
            string userName = GetDomainUserName();
            try
            {
                impersonator = tryImpersonate();
                string SQL = @"
                            IF NOT EXISTS (SELECT * FROM ForerunnerUserItemProperties WHERE UserID IS NULL AND ItemID = @IID)
	                            INSERT ForerunnerUserItemProperties (ItemID, UserID,SavedParameters) SELECT @IID,NULL,@Params 
                            ELSE
                                UPDATE ForerunnerUserItemProperties SET SavedParameters = @Params WHERE UserID IS NULL AND ItemID = @IID
                            ";
                if (SeperateDB)
                    SQL = @"
                            IF NOT EXISTS (SELECT * FROM ForerunnerUserItemProperties WHERE UserID IS NULL AND ItemID = @ItemPath)
	                            INSERT ForerunnerUserItemProperties (ItemID, UserID,SavedParameters) SELECT @ItemPath,NULL,@Params 
                            ELSE
                                UPDATE ForerunnerUserItemProperties SET SavedParameters = @Params WHERE UserID IS NULL AND ItemID = @ItemPath
                            ";
                OpenSQLConn();
                using (SqlCommand SQLComm = new SqlCommand(SQL, SQLConn))
                {
                    SetUserNameParameters(SQLComm, userName);
                    SQLComm.Parameters.AddWithValue("@IID", IID);
                    SQLComm.Parameters.AddWithValue("@ItemPath", path);
                    SQLComm.Parameters.AddWithValue("@Params", parameters);
                    SQLComm.ExecuteNonQuery();
                }

                //Need to try catch and return error
                return getReturnSuccess();
            }
            finally
            {
                if (impersonator != null)
                {
                    impersonator.Dispose();
                }
                CloseSQLConn();
            }
        }

        private string SaveUserParamatersInternal(string path, string parameters,string userNameParam = null)
        {
            string IID = GetItemID(path);
            Impersonator impersonator = null;
            string userName = null;

            if (userNameParam == null)
                userName = GetDomainUserName();
            else
                userName = userNameParam;

            try
            {
                impersonator = tryImpersonate();
                string SQL = @" DECLARE @UID uniqueidentifier
                            SELECT @UID = (SELECT  TOP 1 UserID FROM Users WHERE (UserName = @UserName OR UserName = @DomainUser))
                            IF NOT EXISTS (SELECT * FROM ForerunnerUserItemProperties WHERE UserID = @UID AND ItemID = @IID)
	                            INSERT ForerunnerUserItemProperties (ItemID, UserID,SavedParameters) SELECT @IID,@UID,@Params 
                            ELSE
                                UPDATE ForerunnerUserItemProperties SET SavedParameters = @Params WHERE UserID = @UID AND ItemID = @IID
                            ";

                if (SeperateDB)
                    SQL = @"IF NOT EXISTS (SELECT * FROM ForerunnerUserItemProperties WHERE UserID = @DomainUser AND ItemID = @ItemPath)
	                            INSERT ForerunnerUserItemProperties (ItemID, UserID,SavedParameters) SELECT @ItemPath,@DomainUser,@Params 
                            ELSE
                                UPDATE ForerunnerUserItemProperties SET SavedParameters = @Params WHERE UserID = @DomainUser AND ItemID = @ItemPath
                            ";
                OpenSQLConn();
                using (SqlCommand SQLComm = new SqlCommand(SQL, SQLConn))
                {
                    SetUserNameParameters(SQLComm, userName);
                    SQLComm.Parameters.AddWithValue("@ItemPath", path);
                    SQLComm.Parameters.AddWithValue("@Params", parameters);
                    SQLComm.Parameters.AddWithValue("@IID", IID);
                    SQLComm.ExecuteNonQuery();
                }

                //Need to try catch and return error
                return getReturnSuccess();
            }
            finally
            {
                if (impersonator != null)
                {
                    impersonator.Dispose();
                }
                CloseSQLConn();
            }
        }

        public string GetUserName()
        {
            string userNameWithDomain = GetDomainUserName();
            string[] stringTokens = userNameWithDomain.Split('\\');
            return stringTokens[stringTokens.Length - 1];
        }
        public string GetUserParameters(string path, string userNameParam = null)
        {
            string IID = GetItemID(path);
            Impersonator impersonator = null;
            string userName = null;

            if (userNameParam == null)
                userName = GetDomainUserName();
            else
                userName = userNameParam;

            try
            {
                impersonator = tryImpersonate();
                ParameterModel model;
                string SQL = @" DECLARE @UID uniqueidentifier
                                SELECT @UID = (SELECT  TOP 1  UserID FROM Users WHERE (UserName = @UserName OR UserName = @DomainUser))
                                SELECT SavedParameters, UserID FROM ForerunnerUserItemProperties WHERE (UserID = @UID OR UserID IS NULL) AND ItemID = @IID";

                if (SeperateDB)
                    SQL = @"SELECT SavedParameters, UserID FROM ForerunnerUserItemProperties WHERE (UserID = @DomainUser OR UserID IS NULL) AND ItemID = @ItemPath";

                OpenSQLConn();
                using (SqlCommand SQLComm = new SqlCommand(SQL, SQLConn))
                {
                    SetUserNameParameters(SQLComm, userName);
                    SQLComm.Parameters.AddWithValue("@ItemPath", path);
                    SQLComm.Parameters.AddWithValue("@IID", IID);
                    using (SqlDataReader SQLReader = SQLComm.ExecuteReader())
                    {
                        string savedParams = string.Empty;
                        bool canEditAllUsersSet = HasPermission(path, "Update Parameters");
                        model = new ParameterModel(canEditAllUsersSet);

                        while (SQLReader.Read())
                        {
                            savedParams = SQLReader.GetString(0);
                            ParameterModel.AllUser allUser = ParameterModel.AllUser.IsAllUser;
                            if (!SQLReader.IsDBNull(1))
                            {
                                allUser = ParameterModel.AllUser.NotAllUser;
                            }
                            if (savedParams.Length > 0)
                            {
                                ParameterModel newModel = ParameterModel.parse(savedParams, allUser, canEditAllUsersSet);
                                model.Merge(newModel);
                            }
                        }
                    }
                }

                return model.ToJson(ParameterModel.GeneratedFields.Include);
            }
            finally
            {
                if (impersonator != null)
                {
                    impersonator.Dispose();
                }
                CloseSQLConn();
            }
        }
        public string SaveUserSettings(string settings)
        {
            Impersonator impersonator = null;
            string userName = GetDomainUserName();
            try
            {
                impersonator = tryImpersonate();
                string SQL = @" DECLARE @UID uniqueidentifier
                            SELECT @UID = (SELECT  TOP 1  UserID FROM Users WHERE (UserName = @UserName OR UserName = @DomainUser))
                            IF NOT EXISTS (SELECT * FROM ForerunnerUserSettings WHERE UserID = @UID)
	                            INSERT ForerunnerUserSettings (UserID, Settings) SELECT @UID, @Params
                            ELSE
                                UPDATE ForerunnerUserSettings SET Settings = @Params WHERE UserID = @UID
                            ";
                if (SeperateDB)
                    SQL = @"IF NOT EXISTS (SELECT * FROM ForerunnerUserSettings WHERE UserID = @DomainUser)
	                            INSERT ForerunnerUserSettings (UserID, Settings) SELECT @DomainUser, @Params
                            ELSE
                                UPDATE ForerunnerUserSettings SET Settings = @Params WHERE UserID = @DomainUser
                            ";

                OpenSQLConn();
                using (SqlCommand SQLComm = new SqlCommand(SQL, SQLConn))
                {
                    SetUserNameParameters(SQLComm, userName);
                    SQLComm.Parameters.AddWithValue("@Params", settings);
                    SQLComm.ExecuteNonQuery();
                }

                //Need to try catch and return error
                return getReturnSuccess();
            }
            finally
            {
                if (impersonator != null)
                {
                    impersonator.Dispose();
                }
                CloseSQLConn();
            }
        }

        public string GetUserSettings()
        {
            Impersonator impersonator = null;
            string userName = GetDomainUserName();
            try
            {
                impersonator = tryImpersonate();
                string settings;
                string SQL = @" DECLARE @UID uniqueidentifier
                                SELECT @UID = (SELECT TOP 1 UserID FROM Users WHERE (UserName = @UserName OR UserName = @DomainUser))
                                SELECT Settings FROM ForerunnerUserSettings WHERE UserID = @UID";
                
                if (SeperateDB)
                    SQL = @"SELECT Settings FROM ForerunnerUserSettings WHERE UserID = @DomainUser";

                OpenSQLConn();
                using (SqlCommand SQLComm = new SqlCommand(SQL, SQLConn))
                {
                    SetUserNameParameters(SQLComm, userName);
                    using (SqlDataReader SQLReader = SQLComm.ExecuteReader())
                    {
                        settings = string.Empty;

                        while (SQLReader.Read())
                        {
                            settings = SQLReader.GetString(0);
                        }
                    }
                }

                //Need to try catch and return error
                return settings == "" ? "{}" : settings;
            }
            finally
            {
                if (impersonator != null)
                {
                    impersonator.Dispose();
                }
                CloseSQLConn();
            }
        }
        private string GetItemID(string path)
        {
            if (SeperateDB)
                return "";

            return GetProperty(path, "ID");

        }
        public CatalogItem GetItem(string path)
        {
            string[] paths = new string[1];

            paths[0] = path;
            CatalogItem[] items = GetItemsFromPaths(paths);

            if (items.Length > 0)
                return items[0];
            else
                return null;

        }
        public string GetItemProperty(string path, string propName, bool byID = false)
        {
            try
            {
                lock (rs)
                {
                    if (byID)
                    {
                        // Set the item namespace header to be GUID-based
                        rs.ItemNamespaceHeaderValue = new ItemNamespaceHeader();
                        rs.ItemNamespaceHeaderValue.ItemNamespace = ItemNamespaceEnum.GUIDBased;
                    }

                    string property = GetProperty(path, propName);
                    if (string.IsNullOrEmpty(property))
                    {
                        property = "{}";
                    }
                    return property;
                }
            }
            finally
            {
                if ( rs.ItemNamespaceHeaderValue != null)
                    rs.ItemNamespaceHeaderValue.ItemNamespace = ItemNamespaceEnum.PathBased;
            }
            
            
        }
        public string GetProperty(string path,string propName)
        {
            string[] propertyArray = propName.Split(',');

            //Cant get properties from root in sharepoint.
            if (IsNativeRS == false && path == "/" && propName != "ID")
                return "";

            Property[] props = new Property[propertyArray.Length];
            for (int i = 0; i < propertyArray.Length; i++)
            {
                Property retrieveProp = new Property();

                // Hande SharePoint special, does not seem to support hidden
                if (!IsNativeRS && propertyArray[i].ToLower() == "hidden")
                    propertyArray[i] = "ForerunnerHidden";

                retrieveProp.Name = propertyArray[i];
                props[i] = retrieveProp;
            }            

            Property[] properties = callGetProperties(path, props);

            if (properties.Length == 1) // adapt prior case, only one property query
                return properties[0].Value;
            else if (properties.Length > 1) // this should return mumtiple property but the Api always return one property which is the value of the last property
                return JsonUtility.GetPropertyJson(properties);
            else
                return "";
        }
        public string SetProperty(string path, string properties)
        {
            List<Property> excludeName = new List<Property>();
            string newPath = string.Empty;
            Property[] props = JsonUtility.GetPropertiesList(properties);

            foreach (Property prop in props)
            {
                if (prop.Name != "Name")
                {
                    // Hande SharePoint special, does not seem to support hidden
                    if (!IsNativeRS && prop.Name.ToLower() == "hidden")
                        prop.Name = "ForerunnerHidden";
                    excludeName.Add(prop);
                }
                else
                {
                    newPath = prop.Value;
                }
            }

            if (excludeName.Count() > 0)
            {
                callSetProperties(path, excludeName.ToArray());
            }

            // to rename an item we have to call MoveItem Api
            //setProperties can't do it since it's read-only for this Api
            if (newPath != string.Empty)
            {
                rs.Credentials = GetCredentials();
                rs.MoveItem(path, newPath);
            }

            return getReturnSuccess();
        }
        public string IsFavorite(string path)
        {
            string IID = GetItemID(path);
            Impersonator impersonator = null;
            string userName = GetDomainUserName();
            try
            {
                impersonator = tryImpersonate();
                bool isFav;
                string SQL = @" DECLARE @UID uniqueidentifier
                                SELECT @UID = (SELECT  TOP 1 UserID FROM Users WHERE (UserName = @UserName OR UserName = @DomainUser))
                                SELECT * FROM ForerunnerFavorites WHERE UserID = @UID AND ItemID = @IID";
                if (SeperateDB)
                    SQL = @" SELECT * FROM ForerunnerFavorites WHERE UserID = @DomainUser AND ItemID = @ItemPath";

                OpenSQLConn();
                using (SqlCommand SQLComm = new SqlCommand(SQL, SQLConn))
                {
                    SetUserNameParameters(SQLComm, userName);
                    SQLComm.Parameters.AddWithValue("@ItemPath", path);
                    SQLComm.Parameters.AddWithValue("@IID", IID);
                    
                    using (SqlDataReader SQLReader = SQLComm.ExecuteReader())
                    {
                        isFav = SQLReader.HasRows;
                    }
                }

                //Need to try catch and return error
                JSONTextWriter w = new JSONTextWriter();
                w.WriteStartObject();
                w.WriteMember("IsFavorite");
                w.WriteBoolean(isFav);
                w.WriteEndObject();
                return w.ToString();
            }
            finally
            {
                if (impersonator != null)
                {
                    impersonator.Dispose();
                }
                CloseSQLConn();
            }
        }

        private string GetPath(string path)
        {
            
            if (IsNativeRS || path.IndexOf(SharePointHostName) != -1)
                return path;

            if (path.StartsWith(SharePointHostName))
                return path;
            else
                return SharePointHostName + path.Substring(39);            

        }
        public string CombinePaths(string path1, string path2)
        {
            if (path1.Length == 0)
            {
                return path2;
            }

            if (path2.Length == 0)
            {
                return path1;
            }

            path1 = path1.TrimEnd('/', '\\');
            path2 = path2.TrimStart('/', '\\');

            return string.Format("{0}/{1}", path1, path2);
        }
        public CatalogItem[] GetFavorites()
        {
            if (UseMobilizerDB == false)
                return null;

            Impersonator impersonator = null;
            string userName = GetDomainUserName();
            try
            {
                impersonator = tryImpersonate();
                List<CatalogItem> list = new List<CatalogItem>();
                CatalogItem c;

                string SQL = @"DECLARE @UID uniqueidentifier
                               SELECT @UID = (SELECT  TOP 1 UserID FROM Users WHERE (UserName = @UserName OR UserName = @DomainUser))
                               SELECT DISTINCT Path, Name, ModifiedDate, f.ItemID, Description, MimeType, c.[Type], c.Hidden, f.SPSPath
                               FROM ForerunnerFavorites f INNER JOIN Catalog c ON f.ItemID = c.ItemID WHERE f.UserID = @UID";

                if (SeperateDB)
                {
                    SQL = @"SELECT DISTINCT ItemID FROM ForerunnerFavorites f WHERE f.UserID = @DomainUser";                    
                }

                OpenSQLConn();
                using (SqlCommand SQLComm = new SqlCommand(SQL, SQLConn))
                {
                    SetUserNameParameters(SQLComm, userName);
                    using (SqlDataReader SQLReader = SQLComm.ExecuteReader())
                    {
                        if (SeperateDB)
                        {
                            List<string> items = new List<string>();
                            while (SQLReader.Read())
                            {
                                items.Add(GetPath(SQLReader.GetString(0)));

                            }
                            return GetItemsFromPaths(items.ToArray());
                        }
                        else
                        {
                            while (SQLReader.Read())
                            {
                                
                                //This is a Sharepoint item not stored in the catalog table
                                if (SQLReader.IsDBNull(0))
                                {
                                    //Igore if NULL, this is error only casued by bug before fixed.
                                    if (!SQLReader.IsDBNull(8))
                                    {
                                        string path = SQLReader.GetString(8).ToString();
                                        list.Add(GetItemFromPath(path));
                                    }
                                }
                                else
                                {
                                    c = new CatalogItem();
                                    c.Path = GetPath(SQLReader.GetString(0));
                                    c.Name = SQLReader.GetString(1);
                                    c.ModifiedDate = SQLReader.GetDateTime(2);
                                    c.ModifiedDateSpecified = true;
                                    c.ID = SQLReader.GetGuid(3).ToString();
                                    c.Description = SQLReader.IsDBNull(4) ? "" : SQLReader.GetString(4);
                                    c.MimeType = SQLReader.IsDBNull(5) ? "" : SQLReader.GetString(5);
                                    c.Type = (ItemTypeEnum)SQLReader.GetInt32(6);
                                    c.Hidden = SQLReader.GetBoolean(7);
                                    list.Add(c);
                                }
                                
                            }
                            return list.ToArray();
                        }
                    }
                }
            }
            finally
            {
                if (impersonator != null)
                {
                    impersonator.Dispose();
                }
                CloseSQLConn();
            }
        }


        //For SPS get the Catalogitem from properties
        private CatalogItem GetItemFromPath(string path)
        {
            CatalogItem c = new CatalogItem();
            
            Property[] props = new Property[6];

            props[0] = new Property();
            props[0].Name = "Name";
            
            props[1] = new Property();
            props[1].Name = "Type";

            props[2] = new Property();
            props[2].Name = "ModifiedDate";

            props[3] = new Property();
            props[3].Name = "MimeType";

            props[4] = new Property();
            props[4].Name = "Description";

            props[5] = new Property();
            props[5].Name = "ForerunnerHidden";


            props = callGetProperties(path, props);

            string mimetype = null;
            SetMissingMimetype(path, ref mimetype);
            c.MimeType = mimetype;
            for (int i = 0; i<props.Length; i++)
            {
                if (props[i].Name == "Name")
                    c.Name = props[i].Value;
                else if (props[i].Name == "Type")
                    c.Type = (ItemTypeEnum )Enum.Parse(typeof(ItemTypeEnum), props[i].Value);
                else if (props[i].Name == "ModifiedDate")
                    c.ModifiedDate = DateTime.Parse(props[i].Value);
                else if (props[i].Name == "MimeType")
                    c.MimeType = props[i].Value;
                else if (props[i].Name == "Description")
                    c.Description = props[i].Value;

                else if (props[i].Name == "ForerunnerHidden")
                    c.Hidden = bool.Parse(props[i].Value);
            }
            
            c.Path = path;


            return c;
        }
        public CatalogItem[] GetRecentReports()
        {
            if (UseMobilizerDB == false)
                return null;

            if (SeperateDB)
                return null;

            Impersonator impersonator = null;
            string userName = GetDomainUserName();
            try
            {
                impersonator = tryImpersonate();
                List<CatalogItem> list = new List<CatalogItem>();
                CatalogItem c;

                string SQL = @"SELECT Path, Name, ModifiedDate, ItemID, Description, MimeType, c.[Type], c.Hidden
                            FROM Catalog c INNER JOIN (
                            SELECT ReportID,max(TimeStart) TimeStart
                            FROM ExecutionLogStorage 
                            WHERE  (UserName like '%\'+ @UserName OR UserName = @DomainUser) AND ReportAction = 1 AND format IS NOT NULL AND format <> 'MHTML' AND TimeStart > DATEADD(dd,-60,GETDATE()) 
                            GROUP BY ReportID
                            ) e
                            ON e.ReportID = c.ItemID 
                            ORDER BY TimeStart DESC";


                SQLConn.Open();
                SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);

                SetUserNameParameters(SQLComm, userName);

                SqlDataReader SQLReader;
                SQLReader = SQLComm.ExecuteReader();

                while (SQLReader.Read())
                {
                    c = new CatalogItem();
                    c.Path = GetPath(SQLReader.GetString(0));
                    c.Name = SQLReader.GetString(1);
                    c.ModifiedDate = SQLReader.GetDateTime(2);
                    c.ModifiedDateSpecified = true;
                    c.ID = SQLReader.GetGuid(3).ToString();
                    c.Description = SQLReader.IsDBNull(4) ? "" : SQLReader.GetString(4);
                    c.MimeType = SQLReader.IsDBNull(5) ? "" : SQLReader.GetString(5);
                    c.Type = (ItemTypeEnum)SQLReader.GetInt32(6);
                    c.Hidden = SQLReader.IsDBNull(7) ? false : SQLReader.GetBoolean(7);
                    list.Add(c);

                }
                SQLReader.Close();
                SQLConn.Close();
                return list.ToArray();
            }
            finally
            {
                if (impersonator != null)
                {
                    impersonator.Dispose();
                }
            }
        }

        public string DeleteFavorite(string path)
        {
            string IID = GetItemID(path);
            Impersonator impersonator = null;
            string userName = GetDomainUserName();
            try
            {
                impersonator = tryImpersonate();
                string SQL = @" DECLARE @UID uniqueidentifier
                                SELECT @UID = (SELECT  TOP 1 UserID FROM Users WHERE (UserName = @UserName OR UserName = @DomainUser))
                                DELETE ForerunnerFavorites WHERE ItemID = @IID AND UserID =  @UID";
                if (SeperateDB)
                    SQL = @"DELETE ForerunnerFavorites WHERE ItemID = @ItemPath AND UserID =  @DomainUser";

                OpenSQLConn();
                using (SqlCommand SQLComm = new SqlCommand(SQL, SQLConn))
                {
                    SetUserNameParameters(SQLComm, userName);
                    SQLComm.Parameters.AddWithValue("@ItemPath", path);
                    SQLComm.Parameters.AddWithValue("@IID", IID);

                    SQLComm.ExecuteNonQuery();
                }

                //Need to try catch and return error
                return getReturnSuccess();
            }
            catch (Exception ) {
                return getReturnFailed();
            }
            finally
            {
                if (impersonator != null)
                {
                    impersonator.Dispose();
                }
                CloseSQLConn();
            }
        }

        private void SetUserNameParameters(SqlCommand SQLComm, string domainUserName)
        {                       
            string[] stringTokens = domainUserName.Split('\\');
            string uName = stringTokens[stringTokens.Length - 1];

            if (stringTokens.Length == 1)
                domainUserName = DefaultUserDomain + "\\" + uName;

            SQLComm.Parameters.AddWithValue("@UserName", uName);
            SQLComm.Parameters.AddWithValue("@DomainUser", domainUserName);
        }

        private int IsUserSpecific(string path)
        {
            Property[] props = new Property[2];
            Property retrieveProp = new Property();
            retrieveProp.Name = "HasUserProfileQueryDependencies";
            props[0] = retrieveProp;
            retrieveProp = new Property();
            retrieveProp.Name = "HasUserProfileReportDependencies";
            props[1] = retrieveProp;
            int IsUserSpecific = 1;  //Boolean not working in SQL very well so used int

            Property[] properties = callGetProperties(path, props);

            if (properties.Length == 2 && properties[0].Value.ToLower() == "false" && properties[0].Value.ToLower() == "false")
                IsUserSpecific = 0;

            return IsUserSpecific;
        }

        /// <summary>
        /// This is called by GetThumbnail.  The caller takes care of the impersonation.
        /// </summary>
        /// <param name="image"></param>
        /// <param name="path"></param>
        /// <param name="userName"></param>
        /// <param name="IID"></param>
        /// <param name="IsUserSpecific"></param>
        private void SaveImage(byte[] image, string path, string userName, string IID, int IsUserSpecific)
        {   
            string SQL = @" BEGIN TRAN t1
                            DECLARE @UID uniqueidentifier
                                                                                        
                            IF (@UserSpecific = 1)
                                BEGIN
                                    SELECT @UID = (SELECT TOP 1  UserID FROM Users WHERE (UserName = @UserName OR UserName = @DomainUser))
                                    DELETE ForerunnerCatalog WHERE UserID = @UID AND ItemID = @IID
                                END
                            ELSE
                                BEGIN
                                    SELECT @UID = NULL
                                    DELETE ForerunnerCatalog WHERE UserID IS NULL AND ItemID = @IID
                                END";

            if (image == null)
                SQL += " INSERT ForerunnerCatalog (ItemID, UserID,ThumbnailImage,SaveDate) SELECT @IID,@UID,NULL, GETDATE() ";
            else
                SQL += " INSERT ForerunnerCatalog (ItemID, UserID,ThumbnailImage,SaveDate) SELECT @IID,@UID,@Image, GETDATE()  ";
            SQL += @"      IF @@error <> 0
                                ROLLBACK TRAN t1
                            ELSE
                                COMMIT TRAN t1        
                            ";

            if (SeperateDB)
            {
                SQL = @" BEGIN TRAN t1
                                                                                        
                            IF (@UserSpecific = 1)
                                BEGIN
                                    DELETE ForerunnerCatalog WHERE UserID = @DomainUser AND ItemID = @Path
                                END
                            ELSE
                                BEGIN
                                    DELETE ForerunnerCatalog WHERE UserID IS NULL AND ItemID = @Path
                                END";

                if (image == null)
                    SQL += " INSERT ForerunnerCatalog (ItemID, UserID,ThumbnailImage,SaveDate) SELECT @Path,@DomainUser,NULL, GETDATE() ";
                else
                    SQL += " INSERT ForerunnerCatalog (ItemID, UserID,ThumbnailImage,SaveDate) SELECT @Path,@DomainUser,@Image, GETDATE()  ";
                SQL += @"      IF @@error <> 0
                                ROLLBACK TRAN t1
                            ELSE
                                COMMIT TRAN t1        
                            ";
            }

            Impersonator impersonator = null;
            try
            {
                impersonator = tryImpersonate();
                OpenSQLConn();
                using (SqlCommand SQLComm = new SqlCommand(SQL, SQLConn))
                {
                    SetUserNameParameters(SQLComm, userName);

                    SQLComm.Parameters.AddWithValue("@UserSpecific", IsUserSpecific);
                    SQLComm.Parameters.AddWithValue("@Path", path);
                    if (image == null)
                        SQLComm.Parameters.AddWithValue("@Image", DBNull.Value);                        
                    else
                        SQLComm.Parameters.AddWithValue("@Image", image);                   
                    SQLComm.Parameters.AddWithValue("@IID", IID);
                    SQLComm.ExecuteNonQuery();
                }
            }
            finally
            {
                if (impersonator != null)
                {
                    impersonator.Dispose();
                }
                CloseSQLConn();
            }
        }

        public void SaveThumbnail(string Path, String SessionID)
        {
            byte[] retval = null;
            int isUserSpecific = 0;
            string IID = null;

            try
            {
                lock (ThumbnailsInProcess)
                {
                    if (ThumbnailsInProcess.Contains(Path))
                        return;
                    ThumbnailsInProcess.Add(Path);
                }

                retval = GetDBImage(Path);
                if (retval == null || retval.Length == 0)
                {

                    using (ReportViewer rep = new ReportViewer(this.URL))
                    {
                        retval = rep.GetThumbnail(Path, SessionID, "1", 1.2);
                        isUserSpecific = IsUserSpecific(Path);
                        rep.Dispose();
                    }

                    IID = GetItemID(Path);
                    SaveImage(retval, Path, HttpContext.Current.User.Identity.Name, IID, isUserSpecific);
                }
            }
            catch (Exception e)
            {
                throw e;
            }
            finally
            {
                lock (ThumbnailsInProcess)
                {
                    ThumbnailsInProcess.Remove(Path);
                }
            }

        }

        public byte[] GetDBImage(string path)
        {
            string IID = GetItemID(path);
            Impersonator impersonator = null;
            string userName = GetDomainUserName();
            try
            {
                impersonator = tryImpersonate();
                byte[] retval = null;
                string SQL = @"DECLARE @UID uniqueidentifier
                               SELECT @UID = (SELECT TOP 1 UserID FROM Users WHERE (UserName = @UserName OR UserName = @DomainUser))
                               SELECT ThumbnailImage FROM ForerunnerCatalog f INNER JOIN Catalog c ON c.ItemID = f.ItemID WHERE (f.UserID IS NULL OR f.UserID = @UID) AND c.ItemID = @IID AND c.ModifiedDate <= f.SaveDate";

                //TODO:  Get the modified date from SSRS and pass in
                if (SeperateDB)
                    SQL = @"SELECT ThumbnailImage FROM ForerunnerCatalog f  WHERE (f.UserID IS NULL OR f.UserID = @DomainUser) AND f.ItemID = @Path";


                OpenSQLConn();
                using (SqlCommand SQLComm = new SqlCommand(SQL, SQLConn))
                {
                    //SQLComm.Prepare();
                    SQLComm.Parameters.AddWithValue("@Path", path);
                    SQLComm.Parameters.AddWithValue("@IID", IID);
                    SetUserNameParameters(SQLComm, userName);
                    using (SqlDataReader SQLReader = SQLComm.ExecuteReader())
                    {
                        if (SQLReader.HasRows)
                        {
                            SQLReader.Read();
                            retval = SQLReader.GetSqlBytes(0).Buffer;
                            if (retval == null)
                                retval = new byte[0];

                        }
                    }
                }
                return retval;
            }
            finally
            {
                if (impersonator != null)
                {
                    impersonator.Dispose();
                }
                CloseSQLConn();
            }
        }

        public bool HasPermission(string path, string requiredPermission)
        {
            bool hasPermission = false;
            foreach (string permission in callGetPermissions(path))
            {
                if (permission.IndexOf(requiredPermission, StringComparison.OrdinalIgnoreCase) != -1)
                {
                    hasPermission = true;
                    break;
                }
            }

            return hasPermission;
        }

        public string GetCatalogPermission(string path, string permissions)
        {
            JSONTextWriter w = new JSONTextWriter();
            w.WriteStartObject();
            string[] allPermission = callGetPermissions(path);

            foreach (string per in permissions.Split(','))
            {
                w.WriteMember(per);
                if (allPermission.Contains(per))
                {
                    w.WriteBoolean(true);
                }
                else
                {
                    w.WriteBoolean(false);
                }
            }         
            w.WriteEndObject();
            return w.ToString();
        }

        public byte[] GetCatalogImage(string path)
        {
            bool hasPermission = HasPermission(path, "Execute");
            if (hasPermission)
            {
                byte[] retval = null;
                retval = GetDBImage(path);
                ThreadContext context = null;
                Impersonator sqlImpersonator = null;
                bool isException = false;
                try
                {
                    if (retval == null && QueueThumbnails)
                    {

                        sqlImpersonator = tryImpersonate(true);
                        context = new ThreadContext(path, sqlImpersonator, true /*!GetServerRendering()*/);
                        this.SetCredentials(context.NetworkCredential);
                        ThreadPool.QueueUserWorkItem(this.GetThumbnail, context);                       
                    }
                }
                catch
                {
                    isException = true;
                }
                finally
                {
                    if (isException)
                    {
                        if (context.SecondImpersonator != null)
                        {
                            context.SecondImpersonator.Dispose();
                        }
                        if (context != null)
                        {
                            context.Dispose();
                        }
                        if (sqlImpersonator != null)
                        {
                            sqlImpersonator.Dispose();
                        }
                    }
                }
                return retval;
            }

            return null;
        }

        private bool GetServerRendering()
        {
            ReportViewer rep = new ReportViewer(this.URL);
            return rep.GetServerRendering();
        }

        public void GetThumbnail(object context)
        {
            ThreadContext threadContext = (ThreadContext)context;
            String path = threadContext.Path;
            String userName = threadContext.UserName != null ? threadContext.UserName : threadContext.NetworkCredential.UserName;
            byte[] retval = null;
            int isUserSpecific = 0;
            bool isException = false;
            string IID = null;
            Impersonator sqlImpersonator = threadContext.SqlImpersonator;
            try
            {
                threadContext.Impersonate();
                IID = GetItemID(path);
                using (ReportViewer rep = new ReportViewer(this.URL))
                {
                    rep.SetImpersonator(threadContext.SecondImpersonator);
                    if (Forerunner.Security.AuthenticationMode.GetAuthenticationMode() == System.Web.Configuration.AuthenticationMode.Forms)
                    {
                        rep.SetCredentials(threadContext.NetworkCredential);
                    }
                    retval = rep.GetThumbnail(path, "", "1", 1.2);
                    isUserSpecific = IsUserSpecific(path);
                    rep.Dispose();
                }
                threadContext.Undo();
            }
            catch (Exception e)
            {
                isException = true;
                ExceptionLogGenerator.LogException(e);
            }
            finally
            {
                if (isException)
                {
                    if (threadContext.SecondImpersonator != null)
                    {
                        threadContext.SecondImpersonator.Dispose();
                    }
                    threadContext.Dispose();
                }   
            }

            try
            {
                if (sqlImpersonator != null)
                {
                    sqlImpersonator.Impersonate();
                }
                SaveImage(retval, path.ToString(), userName, IID, isUserSpecific);
             
            }
            catch (Exception e)
            {
                ExceptionLogGenerator.LogException(e);
            }
            finally
            {
                if (sqlImpersonator != null)
                {
                    sqlImpersonator.Dispose();
                }
                threadContext.Dispose();
            }
        }

        public Extension[] ListDeliveryExtensions()
        {
            rs.Credentials = GetCredentials();
            return rs.ListDeliveryExtensions();
        }

        public ExtensionParameter[] GetExtensionSettings(string extension)
        {
            rs.Credentials = GetCredentials();
            ExtensionParameter[] retVal = rs.GetExtensionSettings(extension);
            HashSet<string> visibleExtensions = new HashSet<string>();
            
            Forerunner.SSRS.Execution.ReportExecutionService es = new Execution.ReportExecutionService();
            es.Url= this.URL + "/ReportExecution2005.asmx";
            es.Credentials = GetCredentials();
            Execution.Extension[] renderingExtensions = es.ListRenderingExtensions();
            foreach(Execution.Extension ex in renderingExtensions) 
            {
                if (ex.Visible)
                    visibleExtensions.Add(ex.Name);
            }

            foreach (ExtensionParameter param in retVal)
            {
                if (param.Name == "RenderFormat")
                {
                    List<ValidValue> newList = new List<ValidValue>();
                    foreach (ValidValue validValue in param.ValidValues)
                    {
                        if (visibleExtensions.Contains(validValue.Value))
                        {
                            newList.Add(validValue);
                        }
                    }
                    param.ValidValues = newList.ToArray<ValidValue>();
                }
            }
            
            return retVal;
        }

        public SubscriptionSchedule[] ListSchedules(string siteName)
        {
            rs.Credentials = GetCredentials();
            Schedule[] schedules = null;
            try
            {
                schedules = rs.ListSchedules(siteName);
            }
            catch
            {
            }

            List<SubscriptionSchedule> retVal = new List<SubscriptionSchedule>();
            if (schedules != null)
            {
                foreach (Schedule schedule in schedules)
                {
                    SubscriptionSchedule value = new SubscriptionSchedule();
                    value.ScheduleID = schedule.ScheduleID;
                    value.Name = schedule.Name;
                    value.MatchData = Forerunner.Subscription.MatchDataSerialization.GetMatchDataFromScheduleDefinition(schedule.Definition);
                    retVal.Add(value);
                }
            }

            return retVal.ToArray<SubscriptionSchedule>();
        }

        public class ExtensionSettings
        {

            private string extensionField;

            private ParameterValue[] parameterValues;

            /// <remarks/>
            public string Extension
            {
                get
                {
                    return this.extensionField;
                }
                set
                {
                    this.extensionField = value;
                }
            }

            /// <remarks/>
            [System.Xml.Serialization.XmlArrayItemAttribute(typeof(ParameterValue))]
            public ParameterValue[] ParameterValues
            {
                get
                {
                    return this.parameterValues;
                }
                set
                {
                    this.parameterValues = value;
                }
            }
        }
        

        public string CreateSubscription(SubscriptionInfo info)
        {
            rs.Credentials = GetCredentials();

            string scheduleID = info.SubscriptionSchedule.ScheduleID;
            if (info.SubscriptionSchedule.IsMobilizerSchedule)
                info.SubscriptionSchedule.ScheduleID = null;
            string MatchData = info.SubscriptionSchedule.ScheduleID != null ? info.SubscriptionSchedule.ScheduleID : info.SubscriptionSchedule.MatchData;

            //Handle send now
            string now = DateTime.Now.AddSeconds(60).ToString("O");
            MatchData = MatchData.Replace("@Now", now);

            Forerunner.SSRS.Management.ExtensionSettings settings = new Management.ExtensionSettings();
            settings.Extension = info.ExtensionSettings.Extension;
            settings.ParameterValues = info.ExtensionSettings.ParameterValues;
            string subscriptionID =  rs.CreateSubscription(info.Report, settings, info.Description, info.EventType, MatchData, info.Parameters);
            SaveMobilizerSubscription(info.Report, subscriptionID, scheduleID);
            return subscriptionID;
        }

        private void SaveMobilizerSubscription(string path, string subscriptionID, string scheduleID)
        {
            Impersonator impersonator = null;
            string userName = GetDomainUserName();
            try
            {
                string IID = GetItemID(path);
                impersonator = tryImpersonate();
                string SQL = @" 
                            IF NOT EXISTS (SELECT * FROM ForerunnerSubscriptions WHERE SubscriptionID = @SubscriptionID)
	                            INSERT ForerunnerSubscriptions (SubscriptionID, ScheduleID, ItemID) Values (@SubscriptionID, @ScheduleID, @ItemID)
                            ELSE
                                UPDATE ForerunnerSubscriptions SET ScheduleID = @ScheduleID WHERE SubscriptionID = @SubscriptionID
                            ";

                if (SeperateDB)
                    SQL = @" 
                            IF NOT EXISTS (SELECT * FROM ForerunnerSubscriptions WHERE SubscriptionID = @SubscriptionID)
	                            INSERT ForerunnerSubscriptions (SubscriptionID, ScheduleID, ItemID) Values (@SubscriptionID, @ScheduleID, @ItemPath)
                            ELSE
                                UPDATE ForerunnerSubscriptions SET ScheduleID = @ScheduleID WHERE SubscriptionID = @SubscriptionID
                            ";

                OpenSQLConn();
                using (SqlCommand SQLComm = new SqlCommand(SQL, SQLConn))
                {
                    SetUserNameParameters(SQLComm, userName);
                    SQLComm.Parameters.AddWithValue("@SubscriptionID", subscriptionID);
                    SQLComm.Parameters.AddWithValue("@ScheduleID", scheduleID);
                    SQLComm.Parameters.AddWithValue("@ItemID", IID);
                    SQLComm.Parameters.AddWithValue("@ItemPath", path);
                    SQLComm.ExecuteNonQuery();
                }
            }
            finally
            {
                if (impersonator != null)
                {
                    impersonator.Dispose();
                }
                CloseSQLConn();
            }
        }

        public SubscriptionInfo GetSubscription(string subscriptionID)
        {
            rs.Credentials = GetCredentials();
            Forerunner.SSRS.Management.ExtensionSettings settings;
            string description;
            ActiveState activeState;
            string status;
            string eventType;
            string matchData;
            ParameterValue[] parameters;
            rs.GetSubscriptionProperties(subscriptionID,
                out settings,
                out description,
                out activeState,
                out status,
                out eventType,
                out matchData,
                out parameters);
            ScheduleReference scheduleReference = MatchDataSerialization.GetScheduleFromMatchData(matchData);
            SubscriptionSchedule subscriptionSchedule = new SubscriptionSchedule();
            subscriptionSchedule.ScheduleID = scheduleReference.ScheduleID;
            if (subscriptionSchedule.ScheduleID == null)
            {
                subscriptionSchedule.ScheduleID = GetForerunnerScheduleID(subscriptionID);
            }
            subscriptionSchedule.MatchData = matchData;
            SubscriptionExtensionSettings extensionSettings = new SubscriptionExtensionSettings();
            extensionSettings.Extension = settings.Extension;
            List<ParameterValue> newList = new List<ParameterValue>();
            foreach (ParameterValueOrFieldReference value in settings.ParameterValues)
            {
                newList.Add((ParameterValue) value);
            }
            extensionSettings.ParameterValues = newList.ToArray<ParameterValue>();
            SubscriptionInfo retVal = new SubscriptionInfo(subscriptionID, null, extensionSettings, description, eventType, subscriptionSchedule, parameters);
            return retVal;
        }

        private string GetForerunnerScheduleID(string subscriptionID)
        {
            Impersonator impersonator = null;
            try
            {
                impersonator = tryImpersonate();
                string SQL = @"Select ScheduleID From ForerunnerSubscriptions Where SubscriptionID = @SubscriptionID";
                OpenSQLConn();
                using (SqlCommand SQLComm = new SqlCommand(SQL, SQLConn))
                {
                    SQLComm.Parameters.AddWithValue("@SubscriptionID", subscriptionID);
                    using (SqlDataReader SQLReader = SQLComm.ExecuteReader())
                    {
                        while (SQLReader.Read())
                        {
                            return SQLReader.GetGuid(0).ToString();
                        }
                    }
                }
            }
            finally
            {
                if (impersonator != null)
                {
                    impersonator.Dispose();
                }
                CloseSQLConn();
            }

            return null;
        }

        private string GetMatchData(SubscriptionSchedule subscriptionSchedule)
        {
            return subscriptionSchedule.ScheduleID != null ? subscriptionSchedule.ScheduleID : subscriptionSchedule.MatchData;
        }

        private string GetMatchData(ScheduleDefinition definition)
        {
            XmlDocument xmlDoc = MatchDataSerialization.GetScheduleAsXml(definition);
            StringWriter stringWriter = new StringWriter();
            XmlTextWriter xmlTextWriter = new XmlTextWriter(stringWriter);

            xmlDoc.WriteTo(xmlTextWriter);

            return stringWriter.ToString();
        }
        public void SetSubscription(SubscriptionInfo info)
        {
            rs.Credentials = GetCredentials();
            string scheduleID = info.SubscriptionSchedule.ScheduleID;
            if (info.SubscriptionSchedule.IsMobilizerSchedule)
                info.SubscriptionSchedule.ScheduleID = null;
            string matchData = info.SubscriptionSchedule.ScheduleID != null ? info.SubscriptionSchedule.ScheduleID : info.SubscriptionSchedule.MatchData;

            //Handle send now
            string now = DateTime.Now.AddSeconds(60).ToString("O");
            matchData = matchData.Replace("@Now", now);

            Forerunner.SSRS.Management.ExtensionSettings settings = new Management.ExtensionSettings();
            settings.Extension = info.ExtensionSettings.Extension;
            settings.ParameterValues = info.ExtensionSettings.ParameterValues;
            rs.SetSubscriptionProperties(info.SubscriptionID, settings, info.Description, info.EventType, matchData , info.Parameters);
            SaveMobilizerSubscription(info.Report, info.SubscriptionID, scheduleID);
        }

        public string DeleteSubscription(string subscriptionID)
        {
            rs.Credentials = GetCredentials();
            rs.DeleteSubscription(subscriptionID);
            DeleteMoblizerSubscription(subscriptionID);
            return getReturnSuccess();
        }

        private void DeleteMoblizerSubscription(string subscriptionID)
        {
            Impersonator impersonator = null;
            string userName = GetDomainUserName();
            try
            {
                impersonator = tryImpersonate();
                string SQL = @" Delete From ForerunnerSubscriptions WHERE SubscriptionID = @SubscriptionID";
                OpenSQLConn();
                using (SqlCommand SQLComm = new SqlCommand(SQL, SQLConn))
                {
                    SetUserNameParameters(SQLComm, userName);
                    SQLComm.Parameters.AddWithValue("@SubscriptionID", subscriptionID);
                    SQLComm.ExecuteNonQuery();
                }
            }
            finally
            {
                if (impersonator != null)
                {
                    impersonator.Dispose();
                }
                CloseSQLConn();
            }
        }

        public Management.Subscription[] ListMySubscriptions()
        {
            if (IsNativeRS)
                return ListSubscriptions(null, null);
            else
            {
                //SPS look in all sites
                List<string> sites = new List<string>();
                sites.Add(SharePointHostName);
                if (SharePointSites != null) 
                    sites.AddRange(SharePointSites.Split(';'));
                List<Management.Subscription> subs = new List<Management.Subscription>();

                foreach (string site in sites)
                {
                    try { subs.AddRange(ListSubscriptions(site, null)); }
                    catch { }

                }
                return subs.ToArray();
            }
           
        }

        public Management.Subscription[] ListSubscriptions(string report, string owner)
        {
            rs.Credentials = GetCredentials();
            Management.Subscription[] rsList = rs.ListSubscriptions(report, owner);
            List<Management.Subscription> retVal = new List<Management.Subscription>();
            // Filter it out to only Forerunner managed subscription
            HashSet<string> subscriptionInfos = new HashSet<string>();

            //If it is my subscription
            if (owner == null)
                report = null;

            string IID = report != null ? GetItemID(report) : null;

            Impersonator impersonator = null;
            string userName = GetDomainUserName();
            try
            {
                impersonator = tryImpersonate();
                string SQL = @"Select SubscriptionID From ForerunnerSubscriptions" +  (report != null ? " Where ItemID = @ItemID" : "");
                
                if (SeperateDB)
                    SQL = @"Select SubscriptionID From ForerunnerSubscriptions" + (report != null ? " Where ItemID = @ItemPath" : "");
                
                OpenSQLConn();
                using (SqlCommand SQLComm = new SqlCommand(SQL, SQLConn))
                {
                    SetUserNameParameters(SQLComm, userName);
                    if (report != null)
                    {
                        SQLComm.Parameters.AddWithValue("@ItemID", IID);
                        SQLComm.Parameters.AddWithValue("@ItemPath", report);
                    }
                    using (SqlDataReader SQLReader = SQLComm.ExecuteReader())
                    {
                        while (SQLReader.Read())
                        {
                            string subscriptionID = SQLReader.GetGuid(0).ToString();
                            subscriptionInfos.Add(subscriptionID);
                        }
                    }
                }
            }
            finally
            {
                if (impersonator != null)
                {
                    impersonator.Dispose();
                }
                CloseSQLConn();
            }

            foreach (Management.Subscription sub in rsList)
            {
                if (subscriptionInfos.Contains(sub.SubscriptionID))
                {
                    retVal.Add(sub);
                }
            }

            return retVal.ToArray<Management.Subscription>();
        }

        private string getReturnSuccess()
        {
            JSONTextWriter w = new JSONTextWriter();
            w.WriteStartObject();
            w.WriteMember("Status");
            w.WriteString("Success");
            w.WriteEndObject();
            return w.ToString();
        }

        private string getReturnWarning(string message)
        {
            JSONTextWriter w = new JSONTextWriter();
            w.WriteStartObject();
            w.WriteMember("Warning");
            w.WriteString(message);
            w.WriteEndObject();
            return w.ToString();
        }

        private string getReturnFailed()
        {
            JSONTextWriter w = new JSONTextWriter();
            w.WriteStartObject();
            w.WriteMember("Status");
            w.WriteString("Failed");
            w.WriteEndObject();
            return w.ToString();
        }

        public string GetReportTags(string path, string ID = null)
        {
            string IID;

            if (ID == null)
                IID = GetItemID(path);
            else
                IID = ID;

            Impersonator impersonator = null;
            try
            {
                impersonator = tryImpersonate();
                string tags = string.Empty;
                string SQL = @"SELECT Tags FROM ForerunnerItemTags WHERE ItemID = @ItemID";
                
                if (SeperateDB)
                    SQL = @"SELECT Tags FROM ForerunnerItemTags WHERE ItemID = @ItemPath";

                OpenSQLConn();
                using (SqlCommand SQLComm = new SqlCommand(SQL, SQLConn))
                {
                    SQLComm.Parameters.AddWithValue("@ItemID", IID);
                    SQLComm.Parameters.AddWithValue("@ItemPath", path);

                    using (SqlDataReader SQLReader = SQLComm.ExecuteReader())
                    {
                        while (SQLReader.Read())
                        {
                            tags = SQLReader.GetString(0);
                        }
                    }
                }

                JSONTextWriter w = new JSONTextWriter();
                w.WriteStartObject();
                w.WriteMember("Tags");
                if (tags == "")
                {
                    w.WriteString("NotFound");
                }
                else
                {
                    w.WriteStartArray();
                    foreach (string str in tags.Split(','))
                    {
                        w.WriteString(str);
                    }
                    w.WriteEndArray();
                }
                w.WriteEndObject();
                tags = w.ToString();
                //Need to try catch and return error
                return tags;
            }
            finally
            {
                if (impersonator != null)
                {
                    impersonator.Dispose();
                }
                CloseSQLConn();
            }
        }
        public void SaveReportTags(string tags, string path)
        {
            string IID = GetItemID(path);
            Impersonator impersonator = null;
            try
            {
                impersonator = tryImpersonate();
                string SQL = @"IF NOT EXISTS (SELECT * FROM ForerunnerItemTags WHERE ItemID = @ItemID)
                                  INSERT ForerunnerItemTags (ItemID, Tags,SPSPath) SELECT @ItemID, @Tags,@ItemPath
                               ELSE
                                  UPDATE ForerunnerItemTags SET Tags = @Tags, SPSPath =@ItemPath  WHERE ItemID = @ItemID";

                if (SeperateDB)
                    SQL = @"IF NOT EXISTS (SELECT * FROM ForerunnerItemTags WHERE ItemID = @ItemPath)
                                  INSERT ForerunnerItemTags (ItemID, Tags) SELECT @ItemPath, @Tags
                               ELSE
                                  UPDATE ForerunnerItemTags SET Tags = @Tags WHERE ItemID = @ItemPath";
                OpenSQLConn();
                using (SqlCommand SQLComm = new SqlCommand(SQL, SQLConn))
                {
                    SQLComm.Parameters.AddWithValue("@ItemID", IID);
                    SQLComm.Parameters.AddWithValue("@ItemPath", path);
                    SQLComm.Parameters.AddWithValue("@Tags", tags);
                    SQLComm.ExecuteNonQuery();
                }
                SetProperty(path, "[{\"name\":\"ForerunnerTags\",\"value\":\"true\"}]");
            }
            finally
            {
                if (impersonator != null)
                {
                    impersonator.Dispose();
                }
                CloseSQLConn();
            }
        }

        public CatalogItem[] GetSearchFolderItems(string path)
        {
            if (UseMobilizerDB == false)
                return null;
            
            string mimeType;
            string content = Encoding.UTF8.GetString(GetCatalogResource(path, out mimeType));
            string tags = JsonUtility.GetSearchFolderTags(content);

            Impersonator impersonator = null;
            try
            {
                impersonator = tryImpersonate();
                List<CatalogItem> list = new List<CatalogItem>();
                CatalogItem item;
                string[] tagsList = tags.Split(',');

                StringBuilder SQL = new StringBuilder();

                
                if (!SeperateDB)
                    SQL.Append(@"SELECT c.[Path], c.Name, c.ModifiedDate, c.[Type], c.ItemID, c.Description, c.MimeType, c.Hidden, SPSPath FROM [Catalog] c RIGHT OUTER JOIN (SELECT ItemID,SPSPath FROM ForerunnerItemTags WHERE Tags LIKE '%' + @tag1 + '%'");
                else
                    SQL.Append(@"SELECT ItemID FROM ForerunnerItemTags WHERE Tags LIKE '%' + @tag1 + '%'");

                for (int i = 1; i < tagsList.Length; i++)
                {
                    SQL.Append(" or Tags LIKE '%' + @tag" + (i + 1).ToString() + " + '%'");
                }

                if (!SeperateDB)
                    SQL.Append(") e ON C.ItemID=e.ItemID");

                OpenSQLConn();
                using (SqlCommand SQLComm = new SqlCommand(SQL.ToString(), SQLConn))
                {
                    for (int i = 1; i <= tagsList.Length; i++)
                    {
                        SQLComm.Parameters.AddWithValue("@tag" + i, tagsList[i - 1]);
                    }
                    using (SqlDataReader SQLReader = SQLComm.ExecuteReader())
                    {
                        if (SeperateDB)
                        {
                            List<string> items = new List<string>();
                            while (SQLReader.Read())
                            {
                                items.Add(GetPath(SQLReader.GetString(0)));
                        
                            }
                            return GetItemsFromPaths(items.ToArray());
                        }
                        else
                        {
                           while (SQLReader.Read())
                            {
                                string itemPath = null;
                               //This is a SPS folder not stored in RS DB
                                if (SQLReader.IsDBNull(0))
                                {
                                    //Igore if NULL, this is error only casued by bug before fixed.
                                    if (!SQLReader.IsDBNull(8))
                                    {
                                        itemPath = SQLReader.GetString(8).ToString();
                                        list.Add(GetItemFromPath(itemPath));
                                    }

                                }
                                else
                                {
                                    itemPath = GetPath(SQLReader.GetString(0));
                                    int itemType = SQLReader.GetInt32(3);

                                    item = new CatalogItem();
                                    item.Path = itemPath;
                                    item.Name = SQLReader.GetString(1);
                                    item.ModifiedDate = SQLReader.GetDateTime(2);
                                    item.ModifiedDateSpecified = true;
                                    item.Type = (ItemTypeEnum)itemType;
                                    item.ID = SQLReader.GetGuid(4).ToString();
                                    item.Description = SQLReader.IsDBNull(5) ? "" : SQLReader.GetString(5);
                                    item.MimeType = SQLReader.IsDBNull(6) ? "" : SQLReader.GetString(6);
                                    item.Hidden = SQLReader.GetBoolean(7);
                                    list.Add(item);
                                }
                            }
                            return list.ToArray();
                        }                  
                   
                }  
                }}  
            finally
            {
                CloseSQLConn();

                if (impersonator != null)
                {
                    impersonator.Dispose();
                }
            }
        }      

        public CatalogItem[] GetItemsFromPaths(string[] path)
        {

            List<CatalogItem> list = new List<CatalogItem>();
            rs.Credentials = GetCredentials();

            // TODO: change this to SQL2010 API and use in condition
 
            for (int i = 0; i < path.Length; i++)
            {
                Management.SearchCondition[] sca = new Management.SearchCondition[1];
                sca[0] = new Management.SearchCondition();

                sca[0].Condition = Management.ConditionEnum.Equals;
                sca[0].Name = "Name";

                 int lastSlash = path[i].LastIndexOf('/');

                string ItemPath = path[i].Substring(0, lastSlash);
                sca[0].Value = sca[0].Value + path[i].Split('/').Last();

                //handle shrepoint special
                if (!IsNativeRS)
                {
                    int httpLoc = path[i].IndexOf("://");
                    if (httpLoc == lastSlash-2)
                    {
                        ItemPath = "/";
                        sca[0].Value = path[i].Substring(1);
                    }
                }
                 
                if (ItemPath == "")
                    ItemPath = "/";
                try
                {
                    list.AddRange(rs.FindItems(ItemPath, Management.BooleanOperatorEnum.And, sca));
                }
                catch
                {
                }
            }
            return list.ToArray();
           
        }

        /// <summary>
        /// add the mobilizer setting txt file eventlistener, if it change do related logic
        /// </summary>
        /// <param name="path">file path</param>
        /// <returns>mobilizer setting file content</returns>
        public string ReadMobilizerSetting(string path)
        {
            if (MobilizerSetting == String.Empty)
            {
                lock (SettingLockObj)
                {
                    if (MobilizerSetting == String.Empty)
                    {
                        if (path == null || path == "")
                            path = "custom/MobilizerSettings.txt";

                        string filePath = System.Web.Hosting.HostingEnvironment.MapPath("~/") + path;

                        MobilizerSetting = ReadTXTFile(filePath);


                        //watch the setting file.
                        if (File.Exists(filePath))
                        {
                            FileSystemWatcher watcher = new FileSystemWatcher();

                            watcher.Path = Path.GetDirectoryName(filePath);
                            watcher.Filter = Path.GetFileName(filePath);

                            watcher.Created += new FileSystemEventHandler(MobilizerWatcher_OnChanged);
                            watcher.Changed += new FileSystemEventHandler(MobilizerWatcher_OnChanged);
                            watcher.Renamed += MobilizerWatcher_Renamed;
                            watcher.Deleted += MobilizerWatcher_Deleted;

                            //begin watching.
                            watcher.EnableRaisingEvents = true;
                        }
                    }
                }
            }
            return MobilizerSetting;
        }

        private Dictionary<string,byte[]> LocFiles = new Dictionary<string,byte[]>();
        static private string LocFileFolder = ConfigurationManager.AppSettings["Forerunner.LocFileFolder"];
        static private string DashboardLocFileFolder = ConfigurationManager.AppSettings["Forerunner.DashboardLocFileFolder"];

        public byte[] ReadMobilizerLocFile(string path)
        {
            string FileFolder = null;

            if (LocFileFolder == null || LocFileFolder == "")
                LocFileFolder = "forerunner/reportViewer/Loc/";

            if (DashboardLocFileFolder == null || DashboardLocFileFolder == "")
                DashboardLocFileFolder = "forerunner/Dashboard/Dashboards/";

            if (path.IndexOf("Dashboard") >= 0)
                FileFolder = DashboardLocFileFolder;
            else
                FileFolder = LocFileFolder;

            byte[] result = null;
            string filePath = System.Web.Hosting.HostingEnvironment.MapPath("~/") + FileFolder + Path.GetFileName(path);

            if (!LocFiles.TryGetValue(filePath, out result))
            {
                lock (LocFiles)
                {

                    if (File.Exists(filePath))
                        {
                            result = File.ReadAllBytes(filePath);
                            LocFiles.Add(filePath, result);
                        }
                        else
                        {
                            LocFiles.Add(path, null);
                        }

                        //watch the version file.
                        if (File.Exists(filePath))
                        {
                            FileSystemWatcher watcher = new FileSystemWatcher();

                            watcher.Path = Path.GetDirectoryName(filePath);
                            watcher.Filter = Path.GetFileName(filePath);

                            //if the file change re-read the content and set the version number
                            watcher.Changed += new FileSystemEventHandler(MobilizerLocFile_OnChange);

                            //begin watching.
                            watcher.EnableRaisingEvents = true;
                        }
                    }
                }
            return result;
            }
        

        public string ReadMobilizerVersion(string path)
        {
            if (VersionNumber == null || VersionNumber == String.Empty)
            {
                lock (VersionLockObj)
                {
                    if (VersionNumber == String.Empty)
                    {
                        if (path == null || path == "")
                            path = "Forerunner/version.txt";

                        string filePath = System.Web.Hosting.HostingEnvironment.MapPath("~/") + path;
                        VersionNumber = ReadTXTFile(filePath);

                        //watch the version file.
                        if (File.Exists(filePath))
                        {
                            FileSystemWatcher watcher = new FileSystemWatcher();

                            watcher.Path = Path.GetDirectoryName(filePath);
                            watcher.Filter = Path.GetFileName(filePath);

                            //if the file change re-read the content and set the version number
                            watcher.Changed += new FileSystemEventHandler(MobilizerVersion_OnChange);

                            //begin watching.
                            watcher.EnableRaisingEvents = true;
                        }
                    }
                }
            }

            return VersionNumber;
        }

        private void MobilizerLocFile_OnChange(object sender, FileSystemEventArgs e)
        {
            byte[] result = null;

            result = File.ReadAllBytes(e.FullPath);
            lock (LocFiles)
            {
                LocFiles[e.FullPath] = result;                
            }
            
            
        }

        private void MobilizerVersion_OnChange(object sender, FileSystemEventArgs e)
        {
            VersionNumber = ReadTXTFile(e.FullPath);
        }

        /*
         * get the exist policy for the specific item path
         */
        public string GetItemPolicies(string itemPath)
        {
            bool isInheritParent;

            rs.Credentials = GetCredentials();

            var policyArr = rs.GetPolicies(itemPath, out isInheritParent);

            return JsonUtility.GetPoliciesJson(policyArr, isInheritParent);
        }

        /*
         * get all available roles base on the specific item type ( All, Catalog, Model, System)
         * 
         * in the sharepoint model need to pass item path
         */
        public Role[] ListRoles(string type, string itemPath)
        {
            rs.Credentials = GetCredentials();

            return rs.ListRoles(type, itemPath);
        }

        /*
         * reset current item policy to its parent
         */
        public string InheritParentSecurity(string itemPath)
        {
            rs.Credentials = GetCredentials();
            rs.InheridParentSecurity(itemPath);
            return getReturnSuccess();
        }

        /*
         * set the policits to the specific item
         */
        public string SetItemPolicies(string itemPath, string policies)
        {
            rs.Credentials = GetCredentials();
            Policy[] policyArray = JsonUtility.GetPoliciesFromJson(policies);

            rs.SetPolicies(itemPath, policyArray);

            return getReturnSuccess();
        }

        void MobilizerWatcher_Deleted(object sender, FileSystemEventArgs e)
        {
            MobilizerSetting = "{}";
        }

        void MobilizerWatcher_Renamed(object sender, RenamedEventArgs e)
        {
            //re-loaded the setting file from the new full path when file renamed.
            MobilizerSetting = ReadTXTFile(e.FullPath);
        }

        void MobilizerWatcher_OnChanged(object sender, FileSystemEventArgs e)
        {
            //re-loaded the setting file if file created, change
            MobilizerSetting = ReadTXTFile(e.FullPath);
        }        

        string ReadTXTFile(string path)
        {
            if (File.Exists(path))
            {
                using (StreamReader reader = new StreamReader(path))
                {
                    return reader.ReadToEnd();
                }
            }
            else
            {
                return "{}";
            }
        }

        public string CreateLinkedReport(string linkedReportName, string parentPath, string link)
        {
            //not support set property when create a new linked report so far,
            //user can set property with property dialog
            rs.Credentials = GetCredentials();
            rs.CreateLinkedReport(linkedReportName, parentPath, link, null);
            return getReturnSuccess();
        }

        public string GetReportLink(string linkedReportPath)
        {
            rs.Credentials = GetCredentials();
            JSONTextWriter w = new JSONTextWriter();
            w.WriteStartObject();
            w.WriteMember("linkedReport");
            w.WriteString(rs.GetReportLink(linkedReportPath));
            w.WriteEndObject();

            return w.ToString();
        }

        public string SetReportLink(string linkedReportPath, string newLink)
        {
            rs.Credentials = GetCredentials();
            rs.SetReportLink(linkedReportPath, newLink);
            return getReturnSuccess();
        }

        public SiteCatalog GetCatalog(string root, bool showLinkedReport = false)
        {
            SiteCatalog rootNode = new SiteCatalog();
            rootNode.Name = root;
            rootNode.Path = root;
            rootNode.Type = ItemTypeEnum.Folder;//default to folder type

            GetCatalogItem(rootNode, showLinkedReport);
            
            return rootNode;
        }

        public void GetCatalogItem(SiteCatalog parentNode, bool showLinkedReport)
        {
            string path = parentNode.Path;

            CatalogItem[] items = callListChildren(path, false);

            if (items.Length == 0)
            {
                return;
            }

            parentNode.children = new List<SiteCatalog>();

            foreach (CatalogItem item in items)
            {
                SiteCatalog child = new SiteCatalog();
                child.Name = item.Name;
                child.Type = item.Type;
                child.Path = item.Path;

                //if (item.Type == ItemTypeEnum.Folder || item.Type == ItemTypeEnum.Site)
                if (item.Type == ItemTypeEnum.Folder || item.Type == ItemTypeEnum.Site)
                {
                    //recursively get the catalog
                    GetCatalogItem(child, showLinkedReport);

                    //if the catalog not include valid items then not add them into the list
                    if (child.children != null && child.children.Count() != 0)
                    {
                        parentNode.children.Add(child);
                    }
                } // for now only return report and resource type items, for linked report developer can choose show them or not, default to false
                  // not show hidden items
                else if (((item.Type == ItemTypeEnum.Report || item.Type == ItemTypeEnum.Resource) || (item.Type == ItemTypeEnum.LinkedReport && showLinkedReport)) && !item.Hidden)
                {
                    parentNode.children.Add(child);
                }
            }
        }

        public string MoveItem(MoveItemData data)
        {
            rs.Credentials = GetCredentials();
            rs.MoveItem(data.curFullPath, data.newFullPath);
            return getReturnSuccess();
        }

        public string GetDBConfiguration()
        {
            JSONTextWriter writer = new JSONTextWriter();
            writer.WriteStartObject();
            writer.WriteMember("UseMobilizerDB");
            writer.WriteBoolean(UseMobilizerDB);
            writer.WriteMember("SeperateDB");
            writer.WriteBoolean(SeperateDB);
            writer.WriteEndObject();

            return writer.ToString();
        }

        protected virtual void Dispose(bool disposing)
        {
            if (disposing)
            {
                rs.Dispose();
                SQLConn.Close();
                SQLConn.Dispose();
            }
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }
    }
}
