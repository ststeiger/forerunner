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
using Jayrock.Json;
using System.Threading;
using System.Security.Principal;

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
                builder.Password = DBCredentials.Password;
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

        public byte[] UpdateView(string view, string action, string path)
        {

            if (view == "favorites")
            {
                if (action == "delete")
                    return Encoding.UTF8.GetBytes(this.DeleteFavorite(path));
                else if (action == "add")
                    return Encoding.UTF8.GetBytes(this.SaveFavorite(path));
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

        private CatalogItem[] callListChildren(string path, Boolean isRecursive)
        {
            rs.Credentials = CredentialCache.DefaultNetworkCredentials;
            return rs.ListChildren(HttpUtility.UrlDecode(path), isRecursive);
        }

        private Property[] callGetProperties(string path, Property[] props)
        {
            // Please review this call stack.
            // This call is already in the impersonated context
            // No need to impersonate again.
            rs.Credentials = CredentialCache.DefaultNetworkCredentials;
            return rs.GetProperties(path, props);
        }

        private string[] callGetPermissions(string path)
        {
            rs.Credentials = CredentialCache.DefaultNetworkCredentials;
            return rs.GetPermissions(path);
        }

        public CatalogItem[] ListChildren(string path, Boolean isRecursive)
        {       
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
                impersonator = new Impersonator(DBCredentials.UserName, DBCredentials.Domain, DBCredentials.Password);
            }
            if (!doNotCallImpersonate)
                impersonator.Impersonate();
            return impersonator;
        }

        void CheckSchema()
        {
            Impersonator impersonator = null;
            try
            {
                impersonator = tryImpersonate();
                //This should move to the install program
                string SQL = @"IF NOT EXISTS(SELECT * FROM sysobjects WHERE type = 'u' AND name = 'ForerunnerCatalog')
                            BEGIN	                            
	                            CREATE TABLE ForerunnerCatalog (ItemID uniqueidentifier NOT NULL,UserID uniqueidentifier NULL ,ThumbnailImage image NOT NULL, SaveDate datetime NOT NULL,CONSTRAINT uc_PK UNIQUE (ItemID,UserID))  
                            END
                           IF NOT EXISTS(SELECT * FROM sysobjects WHERE type = 'u' AND name = 'ForerunnerFavorites')
                            BEGIN	                            	                            
                                CREATE TABLE ForerunnerFavorites(ItemID uniqueidentifier NOT NULL UNIQUE ,UserID uniqueidentifier NOT NULL,PRIMARY KEY (ItemID,UserID))
                            END";
                SQLConn.Open();

                SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
                SQLComm.ExecuteNonQuery();
                SQLConn.Close();
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
                            WHERE UserName = @DomainUser AND ReportAction = 1 AND format IS NOT NULL AND format <> 'MHTML' AND TimeStart > DATEADD(dd,-60,GETDATE()) 
                            GROUP BY ReportID
                            ) e
                            ON e.ReportID = c.ItemID 
                            ORDER BY TimeStart DESC";


                SQLConn.Open();
                SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
                
                SQLComm.Parameters.AddWithValue("@DomainUser", HttpContext.Current.User.Identity.Name);

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
                string SQL = @" DECLARE @UID uniqueidentifier
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

        public byte[] GetCatalogImage(string path)
        {
            string execute = "Execute";
            bool hasPermission = false;
            foreach (string permission in callGetPermissions(path))
            {
                if (permission.IndexOf(execute,StringComparison.OrdinalIgnoreCase) != -1)
                {
                    hasPermission = true;
                    break;
                }                
            }

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
                        ThreadPool.QueueUserWorkItem(this.GetThumbnail, context);
                        //Thread t = new Thread(new ParameterizedThreadStart(this.GetThumbnail));                
                        //t.Start(path);
                        //t.Join();                    
                    }
                }
                catch(Exception e)
                {
                    isException = true;
                }
                finally
                {
                    if (isException)
                    {
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
            String userName = threadContext.UserName;
            byte[] retval = null;
            int isUserSpecific;
            Impersonator sqlImpersonator = threadContext.SqlImpersonator;
            try
            {
                threadContext.Impersonate();
                ReportViewer rep = new ReportViewer(this.URL);
                rep.SetImpersonator(threadContext.SecondImpersonator);
                retval = rep.GetThumbnail(path, "", "1", 1.2);
                isUserSpecific = IsUserSpecific(path);
            }
            finally
            {
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
