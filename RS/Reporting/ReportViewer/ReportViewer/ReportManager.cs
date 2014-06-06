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
using Jayrock.Json;
using System.Threading;
using System.Web.Security;
using System.Security.Principal;
using System.Xml;
using System.IO;
using System.Xml.Serialization;
using Forerunner.SSRS;

namespace Forerunner.SSRS.Manager
{
    public class SetResource
    {
        public string resourceName { get; set; }
        public string parentFolder { get; set; }
        public string contents { get; set; }
        public string mimetype { get; set; }
        public string rsInstance { get; set; }
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
        bool isSchemaChecked = false;
        string DefaultUserDomain = null;
        string SharePointHostName = null;
        SqlConnection SQLConn;
        static bool RecurseFolders = ForerunnerUtil.GetAppSetting("Forerunner.RecurseFolders", true);
        static bool QueueThumbnails = ForerunnerUtil.GetAppSetting("Forerunner.QueueThumbnails", false);

        private static bool isReportServerDB(SqlConnection conn)
        {
            string SQL = "SELECT * FROM sysobjects WHERE name = 'ExecutionLogStorage'";

            try
            {
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
                Logger.Trace(LogType.Error, "An exception happens while validating the report server database.  Connection string: " + conn.ConnectionString);
                ExceptionLogGenerator.LogException(e);
                return false;
            }
            finally {
                if (conn.State == System.Data.ConnectionState.Open) {
                    conn.Close();
                }
            }
            return true;
        }

        public static bool ValidateConfig(string ReportServerDataSource, string ReportServerDB, Credentials DBCredentials, bool useIntegratedSecurity)
        {
            SqlConnectionStringBuilder builder = new SqlConnectionStringBuilder();
            builder.DataSource = ReportServerDataSource;
            builder.InitialCatalog = ReportServerDB;
            if (useIntegratedSecurity)
            {
                builder.IntegratedSecurity = true;
            }
            else
            {
                builder.UserID = DBCredentials.UserName;
                String Password = DBCredentials.encrypted ? Security.Encryption.Decrypt(DBCredentials.Password) : DBCredentials.Password;
                builder.Password = Password;
            }


            SqlConnection conn = new SqlConnection(builder.ConnectionString);

            if (ReportManager.isReportServerDB(conn))
            {
                Logger.Trace(LogType.Info, "Validation of the report server database succeeded.");
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
            this.DBCredentials = DBCredentials;
            this.useIntegratedSecurity = useIntegratedSecurity;
            rs.Url = URL;
            this.URL = URL;
            

            rs.Credentials = WSCredentials == null ? null : new NetworkCredential(WSCredentials.UserName, WSCredentials.Password, WSCredentials.Domain);
            SqlConnectionStringBuilder builder = new SqlConnectionStringBuilder();
            builder.DataSource = ReportServerDataSource;
            builder.InitialCatalog = ReportServerDB;
            if (useIntegratedSecurity)
            {
                builder.IntegratedSecurity = true;
            }
            else
            {
               
                builder.UserID = DBCredentials.UserName;
                String Password = DBCredentials.encrypted ? Security.Encryption.Decrypt(DBCredentials.Password) : DBCredentials.Password;
                builder.Password = Password;
            }


            SQLConn = new SqlConnection(builder.ConnectionString);
            CheckSchema();
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

        public IEnumerable<CatalogItem> GetItems(string view, string path)
        {
            if (view == "favorites")
                return this.GetFavorites();
            else if (view == "recent")
                return this.GetRecentReports();
            else if (view == "catalog")
                return this.ListChildren(HttpUtility.UrlDecode(path), false);
            else
                return null;
        }

        public CatalogItem[] FindItems(string folder,string searchOperator, string searchCriteria, bool showAll = false, bool showHidden = false)
        {
            //specify search area, default to search global
            string searchArea = folder == null ? "/" : folder;
            //default search operator to or
            Management.Native.BooleanOperatorEnum oper = Management.Native.BooleanOperatorEnum.Or;

            if (searchOperator == "and")
            {
                oper = Management.Native.BooleanOperatorEnum.And;
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

            if (AuthenticationMode.GetAuthenticationMode() == System.Web.Configuration.AuthenticationMode.Windows)
            {
                return CredentialCache.DefaultNetworkCredentials;
            }

            HttpCookie authCookie = HttpContext.Current.Request.Cookies[FormsAuthentication.FormsCookieName];
            FormsAuthenticationTicket authTicket = FormsAuthentication.Decrypt(authCookie.Value);
            
            return new NetworkCredential(authTicket.Name, authTicket.UserData);
        }

        private CatalogItem[] callListChildren(string path, Boolean isRecursive)
        {
            rs.Credentials = GetCredentials();
            return rs.ListChildren(HttpUtility.UrlDecode(path),isRecursive);
        }

        private void OpenSQLConn()
        {
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

            return rs.GetProperties(HttpUtility.UrlDecode(path), props);
        }
        private void callSetProperties(string path, Property[] props)
        {
            // Please review this call stack.
            // This call is already in the impersonated context
            // No need to impersonate again.
            rs.Credentials = GetCredentials();

             rs.SetProperties(HttpUtility.UrlDecode(path), props);
        }

        private string[] callGetPermissions(string path)
        {
            rs.Credentials = GetCredentials();
            return rs.GetPermissions(path);
        }

        public byte[] GetCatalogResource(string path, out string mimetype)
        {
            rs.Credentials = GetCredentials();
            return rs.GetResourceContents(HttpUtility.UrlDecode(path), out mimetype);
        }
        public String SaveCatalogResource(SetResource setResource)
        {
            bool notFound = false;
            rs.Credentials = GetCredentials();
            try
            {
                var path = CombinePaths(HttpUtility.UrlDecode(setResource.parentFolder), setResource.resourceName);
                path = GetPath(path);
                rs.SetResourceContents(path, Encoding.UTF8.GetBytes(setResource.contents), setResource.mimetype);
            }
            catch (System.Web.Services.Protocols.SoapException e)
            {
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
                                    HttpUtility.UrlDecode(setResource.parentFolder),
                                    false,
                                    Encoding.UTF8.GetBytes(setResource.contents),
                                    setResource.mimetype,
                                    null);
            }

            return getReturnSuccess();
        }

        public CatalogItem[] ListChildren(string path, Boolean isRecursive = false, bool showAll = false, bool showHidden = false)
        {
            Logger.Trace(LogType.Info, "ListChildren:  Path=" + path);
            List<CatalogItem> list = new List<CatalogItem>();
            CatalogItem[] items = callListChildren(path, isRecursive);
            bool added = false;

            foreach (CatalogItem ci in items)
            {
                added = false;
                if ((ci.Type == ItemTypeEnum.Report || ci.Type == ItemTypeEnum.Resource || showAll) && (!ci.Hidden || showHidden))
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
                            if (fci.Type == ItemTypeEnum.Report || fci.Type == ItemTypeEnum.Folder || fci.Type == ItemTypeEnum.Site || fci.Type == ItemTypeEnum.Resource || showAll)
                            {
                                if (!ci.Hidden || showHidden) 
                                {
                                    list.Add(ci);
                                    break;
                                }
                            }
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
            if (isSchemaChecked)
                return;
            Impersonator impersonator = null;
            try
            {
                impersonator = tryImpersonate();
                //This should move to the install program
                string SQL = @"
                           IF NOT EXISTS(SELECT * FROM sysobjects WHERE type = 'u' AND name = 'ForerunnerDBVersion')
                            BEGIN	                            
	                            CREATE TABLE ForerunnerDBVersion (Version varchar(200) NOT NULL,PreviousVersion varchar(200) NOT NULL, PRIMARY KEY (Version))  
                                INSERT ForerunnerDBVersion (Version,PreviousVersion) SELECT '1.3','0'
                            END
                            ELSE
                                UPDATE ForerunnerDBVersion SET PreviousVersion = Version, Version = '1.3'  FROM ForerunnerDBVersion

                            DECLARE @DBVersion varchar(200) 
                            DECLARE @DBVersionPrev varchar(200) 
                            SELECT @DBVersion = Version, @DBVersionPrev =PreviousVersion  FROM ForerunnerDBVersion                        

                           IF NOT EXISTS(SELECT * FROM sysobjects WHERE type = 'u' AND name = 'ForerunnerCatalog')
                            BEGIN	                            
	                            CREATE TABLE ForerunnerCatalog (ItemID uniqueidentifier NOT NULL,UserID uniqueidentifier NULL ,ThumbnailImage image NULL, SaveDate datetime NOT NULL,CONSTRAINT uc_PK UNIQUE (ItemID,UserID))  
                            END
                           IF NOT EXISTS(SELECT * FROM sysobjects WHERE type = 'u' AND name = 'ForerunnerFavorites')
                            BEGIN	                            	                            
                                CREATE TABLE ForerunnerFavorites(ItemID uniqueidentifier NOT NULL,UserID uniqueidentifier NOT NULL,PRIMARY KEY (ItemID,UserID))
                            END
                           IF NOT EXISTS(SELECT * FROM sysobjects WHERE type = 'u' AND name = 'ForerunnerUserItemProperties')
                            BEGIN	                            	                            
                                CREATE TABLE ForerunnerUserItemProperties(ItemID uniqueidentifier NOT NULL,UserID uniqueidentifier NULL, SavedParameters varchar(max), CONSTRAINT uip_PK UNIQUE (ItemID,UserID))
                            END
                           IF NOT EXISTS(SELECT * FROM sysobjects WHERE type = 'u' AND name = 'ForerunnerUserSettings')
                            BEGIN	                            	                            
                                CREATE TABLE ForerunnerUserSettings(UserID uniqueidentifier NOT NULL, Settings varchar(max), PRIMARY KEY (UserID))
                            END

                           /*  Version update Code */
                           IF @DBVersionPrev = '1.1'
                            BEGIN
                                DECLARE @PKName varchar(200) 
                                select @PKName = name from sysobjects where xtype = 'PK' and parent_obj = object_id('ForerunnerUserItemProperties')
                                IF @PKName IS NOT NULL
                                BEGIN
                                    DECLARE @SQL VARCHAR(1000)
                                    SET @SQL = 'ALTER TABLE ForerunnerUserItemProperties DROP CONSTRAINT ' + @PKName
	                                EXEC (@SQL)
                                END

	                            ALTER TABLE ForerunnerUserItemProperties ALTER COLUMN UserID uniqueidentifier NULL

                                IF NOT EXISTS(SELECT * FROM sysobjects WHERE xtype = 'UQ' AND name = 'uc_uip_ItemUser')
                                BEGIN
                                    ALTER TABLE ForerunnerUserItemProperties ADD CONSTRAINT uc_uip_ItemUser UNIQUE (ItemID, UserID)
                                END

                                SELECT @DBVersionPrev = '1.2'
                            END

                            
                            IF @DBVersionPrev ='1.2' 
                                BEGIN
                                    ALTER TABLE ForerunnerCatalog ALTER COLUMN ThumbnailImage Image NULL
                                    SELECT @DBVersionPrev = '1.3'
                                END
                             
                            ";
                OpenSQLConn();

                using (SqlCommand SQLComm = new SqlCommand(SQL, SQLConn))
                {
                    SQLComm.ExecuteNonQuery();
                    isSchemaChecked = true;
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
            try
            {
                impersonator = tryImpersonate();
                string SQL = @" DECLARE @UID uniqueidentifier
                            
                            SELECT @UID = (SELECT UserID FROM Users WHERE (UserName = @UserName OR UserName = @DomainUser))
                            IF NOT EXISTS (SELECT * FROM ForerunnerFavorites WHERE UserID = @UID AND ItemID = @IID)
                            BEGIN
	                            INSERT ForerunnerFavorites (ItemID, UserID) SELECT @IID,@UID
                            END";
                OpenSQLConn();
                using (SqlCommand SQLComm = new SqlCommand(SQL, SQLConn))
                {
                    SetUserNameParameters(SQLComm);
                    //SQLComm.Parameters.AddWithValue("@Path", HttpUtility.UrlDecode(path));
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

        public string SaveUserParameters(string path, string parameters)
        {
            bool canEditAllUsersSet = HasPermission(path, "Update Parameters");
            ParameterModel model = ParameterModel.parse(parameters, ParameterModel.AllUser.KeepDefinition, canEditAllUsersSet);

            string userParameters = model.GetUserParameters(ParameterModel.GeneratedFields.Exclude);
            string returnValue = SaveUserParamatersInternal(path, userParameters);
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
            try
            {
                impersonator = tryImpersonate();
                string SQL = @"
                            IF NOT EXISTS (SELECT * FROM ForerunnerUserItemProperties WHERE UserID IS NULL AND ItemID = @IID)
	                            INSERT ForerunnerUserItemProperties (ItemID, UserID,SavedParameters) SELECT @IID,NULL,@Params 
                            ELSE
                                UPDATE ForerunnerUserItemProperties SET SavedParameters = @Params WHERE UserID IS NULL AND ItemID = @IID
                            ";
                OpenSQLConn();
                using (SqlCommand SQLComm = new SqlCommand(SQL, SQLConn))
                {
                    SetUserNameParameters(SQLComm);
                    SQLComm.Parameters.AddWithValue("@IID", IID);
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

        private string SaveUserParamatersInternal(string path, string parameters)
        {
            string IID = GetItemID(path);
            Impersonator impersonator = null;
            try
            {
                impersonator = tryImpersonate();
                string SQL = @" DECLARE @UID uniqueidentifier
                            SELECT @UID = (SELECT UserID FROM Users WHERE (UserName = @UserName OR UserName = @DomainUser))
                            IF NOT EXISTS (SELECT * FROM ForerunnerUserItemProperties WHERE UserID = @UID AND ItemID = @IID)
	                            INSERT ForerunnerUserItemProperties (ItemID, UserID,SavedParameters) SELECT @IID,@UID,@Params 
                            ELSE
                                UPDATE ForerunnerUserItemProperties SET SavedParameters = @Params WHERE UserID = @UID AND ItemID = @IID
                            ";
                OpenSQLConn();
                using (SqlCommand SQLComm = new SqlCommand(SQL, SQLConn))
                {
                    SetUserNameParameters(SQLComm);
                    //SQLComm.Parameters.AddWithValue("@Path", HttpUtility.UrlDecode(path));
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

        public string GetUserParameters(string path)
        {
            string IID = GetItemID(path);
            Impersonator impersonator = null;
            try
            {
                impersonator = tryImpersonate();
                ParameterModel model;
                string SQL = @" DECLARE @UID uniqueidentifier
                                SELECT @UID = (SELECT UserID FROM Users WHERE (UserName = @UserName OR UserName = @DomainUser))
                                SELECT SavedParameters, UserID FROM ForerunnerUserItemProperties WHERE (UserID = @UID OR UserID IS NULL) AND ItemID = @IID";
                OpenSQLConn();
                using (SqlCommand SQLComm = new SqlCommand(SQL, SQLConn))
                {
                    SetUserNameParameters(SQLComm);
                    //SQLComm.Parameters.AddWithValue("@Path", HttpUtility.UrlDecode(path));
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
            try
            {
                impersonator = tryImpersonate();
                string SQL = @" DECLARE @UID uniqueidentifier
                            SELECT @UID = (SELECT UserID FROM Users WHERE (UserName = @UserName OR UserName = @DomainUser))
                            IF NOT EXISTS (SELECT * FROM ForerunnerUserSettings WHERE UserID = @UID)
	                            INSERT ForerunnerUserSettings (UserID, Settings) SELECT @UID, @Params
                            ELSE
                                UPDATE ForerunnerUserSettings SET Settings = @Params WHERE UserID = @UID
                            ";
                OpenSQLConn();
                using (SqlCommand SQLComm = new SqlCommand(SQL, SQLConn))
                {
                    SetUserNameParameters(SQLComm);
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
            try
            {
                impersonator = tryImpersonate();
                string settings;
                string SQL = @" DECLARE @UID uniqueidentifier
                                SELECT @UID = (SELECT UserID FROM Users WHERE (UserName = @UserName OR UserName = @DomainUser))
                                SELECT Settings FROM ForerunnerUserSettings WHERE UserID = @UID";
                OpenSQLConn();
                using (SqlCommand SQLComm = new SqlCommand(SQL, SQLConn))
                {
                    SetUserNameParameters(SQLComm);
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

            return GetProperty(path,"ID");

        }
        public string GetProperty(string path,string propName)
        {
            Property[] props = new Property[1];
            Property retrieveProp = new Property();
            retrieveProp.Name = propName;
            props[0] = retrieveProp;

            Property[] properties = callGetProperties(path, props);

            if (properties.Length > 0)
                return properties[0].Value;
            else
                return "";
        }
        public void SetProperty(string path, string propName,string value)
        {
            Property[] props = new Property[1];
            Property retrieveProp = new Property();
            retrieveProp.Name = propName;
            retrieveProp.Value = value;

            props[0] = retrieveProp;

            callSetProperties(path, props);            
        }
        public string IsFavorite(string path)
        {
            string IID = GetItemID(path);
            Impersonator impersonator = null;
            try
            {
                impersonator = tryImpersonate();
                bool isFav;
                string SQL = @" DECLARE @UID uniqueidentifier
                                SELECT @UID = (SELECT UserID FROM Users WHERE (UserName = @UserName OR UserName = @DomainUser))
                                SELECT * FROM ForerunnerFavorites WHERE UserID = @UID AND ItemID = @IID";
                OpenSQLConn();
                using (SqlCommand SQLComm = new SqlCommand(SQL, SQLConn))
                {
                    SetUserNameParameters(SQLComm);
                    //SQLComm.Parameters.AddWithValue("@Path", HttpUtility.UrlDecode(path));
                    SQLComm.Parameters.AddWithValue("@IID", IID);
                    using (SqlDataReader SQLReader = SQLComm.ExecuteReader())
                    {
                        isFav = SQLReader.HasRows;
                    }
                }

                //Need to try catch and return error
                JsonWriter w = new JsonTextWriter();
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
            
            if (IsNativeRS)
                return path;

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
            Impersonator impersonator = null;
            try
            {
                impersonator = tryImpersonate();
                List<CatalogItem> list = new List<CatalogItem>();
                CatalogItem c;

                string SQL = @"DECLARE @UID uniqueidentifier
                               SELECT @UID = (SELECT UserID FROM Users WHERE (UserName = @UserName OR UserName = @DomainUser))
                               SELECT DISTINCT Path,Name,ModifiedDate,c.ItemID FROM ForerunnerFavorites f INNER JOIN Catalog c ON f.ItemID = c.ItemID WHERE f.UserID = @UID";
                OpenSQLConn();
                using (SqlCommand SQLComm = new SqlCommand(SQL, SQLConn))
                {
                    SetUserNameParameters(SQLComm);
                    using (SqlDataReader SQLReader = SQLComm.ExecuteReader())
                    {
                        while (SQLReader.Read())
                        {
                            c = new CatalogItem();
                            c.Path = GetPath(SQLReader.GetString(0));
                            c.Name = SQLReader.GetString(1);
                            c.ModifiedDate = SQLReader.GetDateTime(2);
                            c.ModifiedDateSpecified = true;
                            c.Type = ItemTypeEnum.Report;
                            c.ID = SQLReader.GetGuid(3).ToString();
                            list.Add(c);
                        }
                    }
                }
                return list.ToArray();
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

        public CatalogItem[] GetRecentReports()
        {
            Impersonator impersonator = null;
            try
            {
                impersonator = tryImpersonate();
                List<CatalogItem> list = new List<CatalogItem>();
                CatalogItem c;

                string SQL = @"SELECT Path,Name,ModifiedDate,ItemID  
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

                SetUserNameParameters(SQLComm);

                SqlDataReader SQLReader;
                SQLReader = SQLComm.ExecuteReader();

                while (SQLReader.Read())
                {
                    c = new CatalogItem();
                    c.Path = GetPath(SQLReader.GetString(0));
                    c.Name = SQLReader.GetString(1);
                    c.ModifiedDate = SQLReader.GetDateTime(2);
                    c.ModifiedDateSpecified = true;
                    c.Type = ItemTypeEnum.Report;
                    c.ID = SQLReader.GetGuid(3).ToString();
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
            try
            {
                impersonator = tryImpersonate();
                string SQL = @" DECLARE @UID uniqueidentifier
                                SELECT @UID = (SELECT UserID FROM Users WHERE (UserName = @UserName OR UserName = @DomainUser))
                                DELETE ForerunnerFavorites WHERE ItemID = @IID AND UserID =  @UID";
                OpenSQLConn();
                using (SqlCommand SQLComm = new SqlCommand(SQL, SQLConn))
                {
                    SetUserNameParameters(SQLComm);
                    //SQLComm.Parameters.AddWithValue("@Path", HttpUtility.UrlDecode(path));
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

        private void SetUserNameParameters(SqlCommand SQLComm, string domainUserNameFromCaller = null)
        {
            string domainUserName = domainUserNameFromCaller == null ? HttpContext.Current.User.Identity.Name : domainUserNameFromCaller;

                       
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
                                    SELECT @UID = (SELECT UserID FROM Users WHERE (UserName = @UserName OR UserName = @DomainUser))
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
            try
            {
                OpenSQLConn();
                using (SqlCommand SQLComm = new SqlCommand(SQL, SQLConn))
                {
                    SetUserNameParameters(SQLComm, userName);

                    SQLComm.Parameters.AddWithValue("@UserSpecific", IsUserSpecific);
                    SQLComm.Parameters.AddWithValue("@Path", HttpUtility.UrlDecode(path));
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
                CloseSQLConn();
            }
        }

        public void SaveThumbnail(string Path, String SessionID)
        {
            byte[] retval = null;
            int isUserSpecific = 0;
            string IID = null;

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
                SaveImage(retval, Path, null, IID, isUserSpecific);
            }

        }

        public byte[] GetDBImage(string path)
        {
            string IID = GetItemID(path);

            Impersonator impersonator = null;
            try
            {
                impersonator = tryImpersonate();
                byte[] retval = null;
                string SQL = @"DECLARE @UID uniqueidentifier
                               SELECT @UID = (SELECT UserID FROM Users WHERE (UserName = @UserName OR UserName = @DomainUser))
                               SELECT ThumbnailImage FROM ForerunnerCatalog f INNER JOIN Catalog c ON c.ItemID = f.ItemID WHERE (f.UserID IS NULL OR f.UserID = @UID) AND c.ItemID = @IID AND c.ModifiedDate <= f.SaveDate";

                OpenSQLConn();
                using (SqlCommand SQLComm = new SqlCommand(SQL, SQLConn))
                {
                    //SQLComm.Prepare();
                    SQLComm.Parameters.AddWithValue("@Path", HttpUtility.UrlDecode(path));
                    SQLComm.Parameters.AddWithValue("@IID", IID);
                    SetUserNameParameters(SQLComm);
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

        public bool CanCreateSubscription(string path)
        {
            foreach (string permission in callGetPermissions(HttpUtility.UrlDecode(path)))
            {
                if (permission.IndexOf("Create Subscription", StringComparison.OrdinalIgnoreCase) != -1)
                {
                    return true;
                }
            }
            return false;
        }

        public bool HasPermission(string path, string requiredPermission)
        {
            bool hasPermission = false;
            foreach (string permission in callGetPermissions(HttpUtility.UrlDecode(path)))
            {
                if (permission.IndexOf(requiredPermission, StringComparison.OrdinalIgnoreCase) != -1)
                {
                    hasPermission = true;
                    break;
                }
            }

            return hasPermission;
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
                        context = new ThreadContext(HttpUtility.UrlDecode(path), sqlImpersonator, true /*!GetServerRendering()*/);
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
            return rs.GetExtensionSettings(extension);
        }

        public Schedule[] ListSchedules(string siteName)
        {
            rs.Credentials = GetCredentials();
            return rs.ListSchedules(siteName);
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

            string MatchData = MatchDataSerialization.GetMatchDataFromScheduleReference(info.SubscriptionSchedule.ScheduleReference);
            Forerunner.SSRS.Management.ExtensionSettings settings = new Management.ExtensionSettings();
            settings.Extension = info.ExtensionSettings.Extension;
            settings.ParameterValues = info.ExtensionSettings.ParameterValues;
            return rs.CreateSubscription(info.Report, settings, info.Description, info.EventType, MatchData, info.Parameters);
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
            SubscriptionSchedule scheduleReference = MatchDataSerialization.GetScheduleFromMatchData(matchData);
            SubscriptionExtensionSettings extensionSettings = new SubscriptionExtensionSettings();
            extensionSettings.Extension = settings.Extension;
            extensionSettings.ParameterValues = (ParameterValue[])settings.ParameterValues;
            SubscriptionInfo retVal = new SubscriptionInfo(subscriptionID, null, extensionSettings, description, eventType, scheduleReference, parameters);
            return retVal;
        }

        private string GetMatchData(SubscriptionSchedule subscriptionSchedule)
        {
            if (subscriptionSchedule.ScheduleReference != null)
            {
                return MatchDataSerialization.GetMatchDataFromScheduleReference(subscriptionSchedule.ScheduleReference);
            }

            ScheduleDefinition definition = subscriptionSchedule.ScheduleDefinition;
            XmlDocument xmlDoc = MatchDataSerialization.GetScheduleAsXml(definition);
            StringWriter stringWriter = new StringWriter();
            XmlTextWriter xmlTextWriter = new XmlTextWriter(stringWriter);

            xmlDoc.WriteTo(xmlTextWriter);

            return stringWriter.ToString();
        }
        public void SetSubscription(SubscriptionInfo info)
        {
            rs.Credentials = GetCredentials();
            string matchData =GetMatchData(info.SubscriptionSchedule);
            Forerunner.SSRS.Management.ExtensionSettings settings = new Management.ExtensionSettings();
            settings.Extension = info.ExtensionSettings.Extension;
            settings.ParameterValues = info.ExtensionSettings.ParameterValues;
            rs.SetSubscriptionProperties(info.SubscriptionID, settings, info.Description, info.EventType, matchData , info.Parameters);
        }

        public void DeleteSubscription(string subscriptionID)
        {
            rs.Credentials = GetCredentials();
            rs.DeleteSubscription(subscriptionID);
        }

        public Management.Subscription[] ListSubscriptions(string report, string owner)
        {
            rs.Credentials = GetCredentials();
            return rs.ListSubscriptions(report, owner);
        }

        private string getReturnSuccess()
        {
            JsonWriter w = new JsonTextWriter();
            w.WriteStartObject();
            w.WriteMember("Status");
            w.WriteString("Success");
            w.WriteEndObject();
            return w.ToString();
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
