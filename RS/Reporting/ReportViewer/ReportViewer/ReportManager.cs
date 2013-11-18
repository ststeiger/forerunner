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
using ReportManager.Util.Logging;
using Jayrock.Json;
using System.Threading;
using System.Web.Security;
using System.Security.Principal;
using Forerunner.SSRS;

namespace Forerunner.SSRS.Manager
{
    /// <summary>
    /// This is the proxy class that would call RS to get the data
    /// </summary>
    public class ReportManager : IDisposable
    {
        ReportingService2005 rs = new ReportingService2005();
        SqlConnection SQLConn = new SqlConnection();
        Credentials WSCredentials;
        Credentials DBCredentials;
        Impersonator impersonator;
        bool useIntegratedSecurity;
        string URL;
        bool isSchemaChecked = false;

        public ReportManager(string URL, Credentials WSCredentials, string ReportServerDataSource, string ReportServerDB, Credentials DBCredentials, bool useIntegratedSecurity)
        {
            this.WSCredentials = WSCredentials;
            this.DBCredentials = DBCredentials;
            this.useIntegratedSecurity = useIntegratedSecurity;
            rs.Url = URL + "/ReportService2005.asmx";
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


            SQLConn.ConnectionString = builder.ConnectionString;
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

        private ICredentials credentials = null;
        private void SetCredentials(ICredentials credentials)
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
            return rs.ListChildren(HttpUtility.UrlDecode(path), isRecursive);
        }

        private Property[] callGetProperties(string path, Property[] props)
        {
            // Please review this call stack.
            // This call is already in the impersonated context
            // No need to impersonate again.
            rs.Credentials = GetCredentials();
            return rs.GetProperties(path, props);
        }

        private string[] callGetPermissions(string path)
        {
            rs.Credentials = GetCredentials();
            return rs.GetPermissions(path);
        }

        public CatalogItem[] ListChildren(string path, Boolean isRecursive)
        {
            Logger.Trace(LogType.Info, "ListChildren:  Path=" + path);
            List<CatalogItem> list = new List<CatalogItem>();
            CatalogItem[] items = callListChildren(path, isRecursive);
            foreach (CatalogItem ci in items)
            {
                if (ci.Type == ItemTypeEnum.Report || ci.Type == ItemTypeEnum.LinkedReport)
                {
                    if (!ci.Hidden)
                        list.Add(ci);
                }
                if (ci.Type == ItemTypeEnum.Folder && !ci.Hidden)
                {
                    CatalogItem[] folder = callListChildren(ci.Path, false);
                    foreach (CatalogItem fci in folder)
                    {
                        if (fci.Type == ItemTypeEnum.Report || fci.Type == ItemTypeEnum.LinkedReport || fci.Type == ItemTypeEnum.Folder)
                        {
                            if (!ci.Hidden)
                            {
                                list.Add(ci);
                                break;
                            }
                        }
                    }
                }
            }
            return list.ToArray();
        }

        private Impersonator tryImpersonate(bool doNotCallImpersonate = false) 
        {
            if (!useIntegratedSecurity) return null;
            if (impersonator == null)
            {
                String Password = DBCredentials.encrypted ? Security.Encryption.Decrypt(DBCredentials.Password) : DBCredentials.Password;
                impersonator = new Impersonator(DBCredentials.UserName, DBCredentials.Domain, Password);
            }
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
                                INSERT ForerunnerDBVersion (Version,PreviousVersion) SELECT '1.1','0'
                            END
                            ELSE
                                UPDATE ForerunnerDBVersion SET PreviousVersion = Version,Version = '1.1'  FROM ForerunnerDBVersion

                            DECLARE @DBVersion varchar(200) 
                            DECLARE @DBVersionPrev varchar(200) 
                            SELECT @DBVersion = Version, @DBVersionPrev =PreviousVersion  FROM ForerunnerDBVersion                        

                           IF NOT EXISTS(SELECT * FROM sysobjects WHERE type = 'u' AND name = 'ForerunnerCatalog')
                            BEGIN	                            
	                            CREATE TABLE ForerunnerCatalog (ItemID uniqueidentifier NOT NULL,UserID uniqueidentifier NULL ,ThumbnailImage image NOT NULL, SaveDate datetime NOT NULL,CONSTRAINT uc_PK UNIQUE (ItemID,UserID))  
                            END
                           IF NOT EXISTS(SELECT * FROM sysobjects WHERE type = 'u' AND name = 'ForerunnerFavorites')
                            BEGIN	                            	                            
                                CREATE TABLE ForerunnerFavorites(ItemID uniqueidentifier NOT NULL,UserID uniqueidentifier NOT NULL,PRIMARY KEY (ItemID,UserID))
                            END
                            IF NOT EXISTS(SELECT * FROM sysobjects WHERE type = 'u' AND name = 'ForerunnerUserItemProperties')
                            BEGIN	                            	                            
                                CREATE TABLE ForerunnerUserItemProperties(ItemID uniqueidentifier NOT NULL,UserID uniqueidentifier NULL, SavedParameters varchar(max), PRIMARY KEY (ItemID))
                            END
                            IF NOT EXISTS(SELECT * FROM sysobjects WHERE type = 'u' AND name = 'ForerunnerUserSettings')
                            BEGIN	                            	                            
                                CREATE TABLE ForerunnerUserSettings(UserID uniqueidentifier NOT NULL, Settings varchar(max), PRIMARY KEY (UserID))
                            END

                          /*  Version update Code */
                           /*
                           IF @DBVersionPrev = 1.1 
                             BEGIN
                              ALTER TABLE ForerunnerCatalog ...
                              ALTER TABLE ForerunnerUserItemProperties ...
                              SELECT @DBVersionPrev = '1.2'
                             END

                           IF @DBVersionPrev = 1.2 
                             BEGIN
                              ALTER TABLE ForerunnerCatalog ...
                              ALTER TABLE ForerunnerUserItemProperties ...
                              SELECT @DBVersionPrev = '1.3'
                             END


                           */ 

                            ";
                SQLConn.Open();

                SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
                SQLComm.ExecuteNonQuery();
                SQLConn.Close();
                isSchemaChecked = true;
            }
            finally
            {
                if (impersonator != null)
                {
                    impersonator.Undo();
                }
            }
        }

        public string SaveFavorite(string path)
        {
            Impersonator impersonator = null;
            try
            {
                impersonator = tryImpersonate();
                string SQL = @" DECLARE @UID uniqueidentifier
                            DECLARE @IID uniqueidentifier
                            SELECT @UID = (SELECT UserID FROM Users WHERE (UserName = @UserName OR UserName = @DomainUser))
                            SELECT @IID = (SELECT ItemID FROM Catalog WHERE Path = @Path  )
                            IF NOT EXISTS (SELECT * FROM ForerunnerFavorites WHERE UserID = @UID AND ItemID = @IID)
                            BEGIN
	                            INSERT ForerunnerFavorites (ItemID, UserID) SELECT @IID,@UID
                            END";
                SQLConn.Open();
                SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
                SetUserNameParameters(SQLComm);
                SQLComm.Parameters.AddWithValue("@Path", HttpUtility.UrlDecode(path));
                SQLComm.ExecuteNonQuery();
                SQLConn.Close();

                //Need to try catch and return error
                JsonWriter w = new JsonTextWriter();
                w.WriteStartObject();
                w.WriteMember("Status");
                w.WriteString("Success");
                w.WriteEndObject();
                return w.ToString();
            }
            finally
            {
                if (impersonator != null)
                {
                    impersonator.Undo();
                }
            }
        }

        public string SaveUserParamaters(string path, string parameters)
        {
            string returnValue = String.Empty;

            bool canEditAllUsersSet = HasPermission(path, "Update Parameters");
            ParameterModel model = ParameterModel.parse(parameters, ParameterModel.AllUser.KeepDefinition, canEditAllUsersSet);

            string userParameters = model.GetUserParameters();
            returnValue = SaveUserParamatersInternal(path, userParameters);
            if (returnValue.IndexOf("Success", StringComparison.InvariantCultureIgnoreCase) == -1)
            {
                return returnValue;
            }

            if (canEditAllUsersSet)
            {
                string allUserParameters = model.GetAllUserParameters();
                returnValue = SaveAllUserParamaters(path, allUserParameters);
            }

            return returnValue;
        }

        private string SaveAllUserParamaters(string path, string parameters)
        {
            Impersonator impersonator = null;
            try
            {
                impersonator = tryImpersonate();
                string SQL = @"
                            DECLARE @IID uniqueidentifier
                            SELECT @IID = (SELECT ItemID FROM Catalog WHERE Path = @Path  )
                            IF NOT EXISTS (SELECT * FROM ForerunnerUserItemProperties WHERE UserID = NULL AND ItemID = @IID)
	                            INSERT ForerunnerUserItemProperties (ItemID, UserID,SavedParameters) SELECT @IID,NULL,@Params 
                            ELSE
                                UPDATE ForerunnerUserItemProperties SET SavedParameters = @Params WHERE UserID = NULL AND ItemID = @IID
                            ";
                SQLConn.Open();
                SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
                SetUserNameParameters(SQLComm);
                SQLComm.Parameters.AddWithValue("@Path", HttpUtility.UrlDecode(path));
                SQLComm.Parameters.AddWithValue("@Params", parameters);
                SQLComm.ExecuteNonQuery();
                SQLConn.Close();

                //Need to try catch and return error
                JsonWriter w = new JsonTextWriter();
                w.WriteStartObject();
                w.WriteMember("Status");
                w.WriteString("Success");
                w.WriteEndObject();
                return w.ToString();
            }
            finally
            {
                if (impersonator != null)
                {
                    impersonator.Undo();
                }
            }
        }

        private string SaveUserParamatersInternal(string path, string parameters)
        {
            Impersonator impersonator = null;
            try
            {
                impersonator = tryImpersonate();
                string SQL = @" DECLARE @UID uniqueidentifier
                            DECLARE @IID uniqueidentifier
                            SELECT @UID = (SELECT UserID FROM Users WHERE (UserName = @UserName OR UserName = @DomainUser))
                            SELECT @IID = (SELECT ItemID FROM Catalog WHERE Path = @Path  )
                            IF NOT EXISTS (SELECT * FROM ForerunnerUserItemProperties WHERE UserID = @UID AND ItemID = @IID)
	                            INSERT ForerunnerUserItemProperties (ItemID, UserID,SavedParameters) SELECT @IID,@UID,@Params 
                            ELSE
                                UPDATE ForerunnerUserItemProperties SET SavedParameters = @Params WHERE UserID = @UID AND ItemID = @IID
                            ";
                SQLConn.Open();
                SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
                SetUserNameParameters(SQLComm);
                SQLComm.Parameters.AddWithValue("@Path", HttpUtility.UrlDecode(path));
                SQLComm.Parameters.AddWithValue("@Params", parameters);
                SQLComm.ExecuteNonQuery();
                SQLConn.Close();

                //Need to try catch and return error
                JsonWriter w = new JsonTextWriter();
                w.WriteStartObject();
                w.WriteMember("Status");
                w.WriteString("Success");
                w.WriteEndObject();
                return w.ToString();
            }
            finally
            {
                if (impersonator != null)
                {
                    impersonator.Undo();
                }
            }
        }

        public string GetUserParameters(string path)
        {
            Impersonator impersonator = null;
            try
            {
                impersonator = tryImpersonate();
                string SQL = @" DECLARE @UID uniqueidentifier
                                DECLARE @IID uniqueidentifier
                                SELECT @UID = (SELECT UserID FROM Users WHERE (UserName = @UserName OR UserName = @DomainUser))
                                SELECT @IID = (SELECT ItemID FROM Catalog WHERE Path = @Path  )
                                SELECT SavedParameters, UserID FROM ForerunnerUserItemProperties WHERE (UserID = @UID OR UserID IS NULL) AND ItemID = @IID";
                SQLConn.Open();
                SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
                SetUserNameParameters(SQLComm);
                SQLComm.Parameters.AddWithValue("@Path", HttpUtility.UrlDecode(path));
                SqlDataReader SQLReader;
                SQLReader = SQLComm.ExecuteReader();
                string savedParams = string.Empty;
                Guid userID = Guid.Empty;
                ParameterModel model = new ParameterModel();
                bool canEditAllUsersSet = HasPermission(path, "Update Parameters");

                while (SQLReader.Read())
                {
                    savedParams = SQLReader.GetString(0);
                    userID = SQLReader.GetGuid(1);
                    ParameterModel.AllUser allUser = userID == Guid.Empty ? ParameterModel.AllUser.IsAllUser : ParameterModel.AllUser.NotAllUser;
                    if (savedParams.Length > 0)
                    {
                        ParameterModel newModel = ParameterModel.parse(savedParams, allUser, canEditAllUsersSet);
                        model.merge(newModel);
                    }
                }
                SQLReader.Close();
                SQLConn.Close();

                return model.ToJson();
            }
            finally
            {
                if (impersonator != null)
                {
                    impersonator.Undo();
                }
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
                SQLConn.Open();
                SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
                SetUserNameParameters(SQLComm);
                SQLComm.Parameters.AddWithValue("@Params", settings);
                SQLComm.ExecuteNonQuery();
                SQLConn.Close();

                //Need to try catch and return error
                JsonWriter w = new JsonTextWriter();
                w.WriteStartObject();
                w.WriteMember("Status");
                w.WriteString("Success");
                w.WriteEndObject();
                return w.ToString();
            }
            finally
            {
                if (impersonator != null)
                {
                    impersonator.Undo();
                }
            }
        }

        public string GetUserSettings()
        {
            Impersonator impersonator = null;
            try
            {
                impersonator = tryImpersonate();
                string SQL = @" DECLARE @UID uniqueidentifier
                                SELECT @UID = (SELECT UserID FROM Users WHERE (UserName = @UserName OR UserName = @DomainUser))
                                SELECT Settings FROM ForerunnerUserSettings WHERE UserID = @UID";
                SQLConn.Open();
                SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
                SetUserNameParameters(SQLComm);
                SqlDataReader SQLReader;
                SQLReader = SQLComm.ExecuteReader();
                string settings = string.Empty;

                while (SQLReader.Read())
                {
                    settings = SQLReader.GetString(0);
                }
                SQLReader.Close();
                SQLConn.Close();

                //Need to try catch and return error
                return settings == "" ? "{}" : settings;
            }
            finally
            {
                if (impersonator != null)
                {
                    impersonator.Undo();
                }
            }
        }
        public string IsFavorite(string path)
        {
            Impersonator impersonator = null;
            try
            {
                impersonator = tryImpersonate();
                string SQL = @" DECLARE @UID uniqueidentifier
                                DECLARE @IID uniqueidentifier
                                SELECT @UID = (SELECT UserID FROM Users WHERE (UserName = @UserName OR UserName = @DomainUser))
                                SELECT @IID = (SELECT ItemID FROM Catalog WHERE Path = @Path  )
                                SELECT * FROM ForerunnerFavorites WHERE UserID = @UID AND ItemID = @IID";
                SQLConn.Open();
                SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
                SetUserNameParameters(SQLComm);
                SQLComm.Parameters.AddWithValue("@Path", HttpUtility.UrlDecode(path));
                SqlDataReader SQLReader;
                SQLReader = SQLComm.ExecuteReader();
                bool isFav = SQLReader.HasRows;
                SQLReader.Close();
                SQLConn.Close();

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
                    impersonator.Undo();
                }
            }
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
                               SELECT DISTINCT Path,Name,ModifiedDate FROM ForerunnerFavorites f INNER JOIN Catalog c ON f.ItemID = c.ItemID WHERE f.UserID = @UID";
                SQLConn.Open();
                SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);

                SetUserNameParameters(SQLComm);
                SqlDataReader SQLReader;
                SQLReader = SQLComm.ExecuteReader();

                while (SQLReader.Read())
                {
                    c = new CatalogItem();
                    c.Path = SQLReader.GetString(0);
                    c.Name = SQLReader.GetString(1);
                    c.ModifiedDate = SQLReader.GetDateTime(2);
                    c.ModifiedDateSpecified = true;
                    c.Type = ItemTypeEnum.Report;
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
                    impersonator.Undo();
                }
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

                string SQL = @"SELECT Path,Name,ModifiedDate  
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
                    c.Path = SQLReader.GetString(0);
                    c.Name = SQLReader.GetString(1);
                    c.ModifiedDate = SQLReader.GetDateTime(2);
                    c.ModifiedDateSpecified = true;
                    c.Type = ItemTypeEnum.Report;
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
                    impersonator.Undo();
                }
            }
        }

        public string DeleteFavorite(string path)
        {
            Impersonator impersonator = null;
            try
            {
                impersonator = tryImpersonate();
                string SQL = @" DECLARE @UID uniqueidentifier
                                DECLARE @IID uniqueidentifier
                                SELECT @UID = (SELECT UserID FROM Users WHERE (UserName = @UserName OR UserName = @DomainUser))
                                SELECT @IID = (SELECT ItemID FROM Catalog WHERE Path = @Path  )
                                DELETE ForerunnerFavorites WHERE ItemID = @IID AND UserID =  @UID";
                SQLConn.Open();
                SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);

                SetUserNameParameters(SQLComm);
                SQLComm.Parameters.AddWithValue("@Path", HttpUtility.UrlDecode(path));
                SQLComm.ExecuteNonQuery();
                SQLConn.Close();

                //Need to try catch and return error
                JsonWriter w = new JsonTextWriter();
                w.WriteStartObject();
                w.WriteMember("Status");
                w.WriteString("Success");
                w.WriteEndObject();
                return w.ToString();
            }
            finally
            {
                if (impersonator != null)
                {
                    impersonator.Undo();
                }
            }
        }

        private static void SetUserNameParameters(SqlCommand SQLComm, string domainUserNameFromCaller = null)
        {
            string domainUserName = domainUserNameFromCaller == null ? HttpContext.Current.User.Identity.Name : domainUserNameFromCaller;

                       
            string[] stringTokens = domainUserName.Split('\\');
            string uName = stringTokens[stringTokens.Length - 1];
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
        private void SaveImage(byte[] image, string path, string userName, int IsUserSpecific)
        {   
            //Impersonator impersonator = null;
            //try
            //{
            //    impersonator = tryImpersonate();
                string SQL = @" BEGIN TRAN t1
                                DECLARE @UID uniqueidentifier
                                DECLARE @IID uniqueidentifier
                                SELECT @IID = (SELECT ItemID FROM Catalog WHERE Path = @Path  )                                                        
                                IF (@UserSpecific = 1)
                                    BEGIN
                                        SELECT @UID = (SELECT UserID FROM Users WHERE (UserName = @UserName OR UserName = @DomainUser))
                                        DELETE ForerunnerCatalog WHERE UserID = @UID AND ItemID = @IID
                                    END
                                ELSE
                                    BEGIN
                                        SELECT @UID = NULL
                                        DELETE ForerunnerCatalog WHERE UserID IS NULL AND ItemID = @IID
                                    END
                                INSERT ForerunnerCatalog (ItemID, UserID,ThumbnailImage,SaveDate) SELECT @IID,@UID,@Image, GETDATE()                            
                                IF @@error <> 0
                                    ROLLBACK TRAN t1
                                ELSE
                                    COMMIT TRAN t1        
                                ";
                SQLConn.Open();
                SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);

                SetUserNameParameters(SQLComm, userName);

                SQLComm.Parameters.AddWithValue("@UserSpecific", IsUserSpecific);
                SQLComm.Parameters.AddWithValue("@Path", HttpUtility.UrlDecode(path));
                SQLComm.Parameters.AddWithValue("@Image", image);
                SQLComm.ExecuteNonQuery();
                SQLConn.Close();
            //}
            //finally
            //{
            //    if (impersonator != null)
            //    {
            //        impersonator.Undo();
            //    }
            //}
        }
        public byte[] GetDBImage(string path)
        {
            Impersonator impersonator = null;
            try
            {
                impersonator = tryImpersonate();
                byte[] retval = null;
                string SQL = @"DECLARE @IID uniqueidentifier
                               DECLARE @UID uniqueidentifier
                               SELECT @UID = (SELECT UserID FROM Users WHERE (UserName = @UserName OR UserName = @DomainUser))
                               SELECT ThumbnailImage FROM ForerunnerCatalog f INNER JOIN Catalog c ON c.ItemID = f.ItemID WHERE (f.UserID IS NULL OR f.UserID = @UID) AND c.Path = @Path AND c.ModifiedDate <= f.SaveDate";

                SQLConn.Open();
                SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
                //SQLComm.Prepare();
                SQLComm.Parameters.AddWithValue("@Path", HttpUtility.UrlDecode(path));
                SetUserNameParameters(SQLComm);
                SqlDataReader SQLReader;
                SQLReader = SQLComm.ExecuteReader();

                if (SQLReader.HasRows)
                {
                    SQLReader.Read();
                    retval = SQLReader.GetSqlBytes(0).Buffer;
                }
                SQLReader.Close();
                SQLConn.Close();
                return retval;
            }
            finally
            {
                if (impersonator != null)
                {
                    impersonator.Undo();
                }
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
                    if (retval == null)
                    {

                        sqlImpersonator = tryImpersonate(true);
                        context = new ThreadContext(HttpUtility.UrlDecode(path), sqlImpersonator, !GetServerRendering());
                        this.SetCredentials(context.NetworkCredential);
                        ThreadPool.QueueUserWorkItem(this.GetThumbnail, context);
                        //Thread t = new Thread(new ParameterizedThreadStart(this.GetThumbnail));                
                        //t.Start(path);
                        //t.Join();                    
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
            Impersonator sqlImpersonator = threadContext.SqlImpersonator;
            try
            {
                threadContext.Impersonate();
                ReportViewer rep = new ReportViewer(this.URL);
                rep.SetImpersonator(threadContext.SecondImpersonator);
                if (Forerunner.Security.AuthenticationMode.GetAuthenticationMode() == System.Web.Configuration.AuthenticationMode.Forms)
                {
                    rep.SetCredentials(threadContext.NetworkCredential);
                }
                retval = rep.GetThumbnail(path, "", "1", 1.2);
                isUserSpecific = IsUserSpecific(path);
            }
            catch
            {
                isException = true;
            }
            finally
            {
                if (isException)
                {
                    if (sqlImpersonator != null)
                    {
                        sqlImpersonator.Dispose();
                    }
                    if (threadContext.SecondImpersonator != null)
                    {
                        threadContext.SecondImpersonator.Dispose();
                    }
                }
                threadContext.Undo();
                threadContext.Dispose();
            }
            if (retval != null)
            {
                
                try
                {
                    if (sqlImpersonator != null)
                    { 
                        sqlImpersonator.Impersonate(); 
                    }
                    SaveImage(retval, path.ToString(), userName, isUserSpecific);
                }
                finally
                {
                    if (sqlImpersonator != null)
                    {
                        sqlImpersonator.Dispose();
                    }
                }
            }
        }

        protected virtual void Dispose(bool disposing)
        {
            if (disposing)
            {
                rs.Dispose();
                SQLConn.Close();
                SQLConn.Dispose();
                if (impersonator != null)
                {
                    impersonator.Undo();
                }
            }
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }
    }
}
