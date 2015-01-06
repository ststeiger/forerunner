using System;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Security.AccessControl;
using System.ServiceProcess;
using System.Xml;
using Forerunner.Security;
using Microsoft.Win32;


namespace ReportMannagerConfigTool
{
    public static class ConfigToolHelper
    {
        /// <summary>
        /// Detect whether IIS web server installed on the machine and running.
        /// </summary>
        /// <returns>True: installed; False: not</returns>
        public static bool isIISInstalled()
        {
            try
            {
                ServiceController sc = new ServiceController("W3SVC");
                if ((sc.Status.Equals(ServiceControllerStatus.Stopped) || sc.Status.Equals(ServiceControllerStatus.StopPending)))
                {
                    return false;
                }
            }
            catch
            {
                return false;
            }
            return true;
            
        }

        /// <summary>
        /// Detect whether UWS web server installed on the machine
        /// </summary>
        /// <returns>True: installed; False: not</returns>
        public static bool isUWSInstalled()
        {
            //SYSTEM\CurrentControlSet\services\UltiDev Web Server Pro" "Start"
            string[] valueNames;

            RegistryKey target = Registry.LocalMachine.OpenSubKey("SYSTEM").OpenSubKey("CurrentControlSet").OpenSubKey("services").OpenSubKey("UltiDev Web Server Pro");

            if (target == null)
                return false;

            valueNames = target.GetValueNames();
            foreach (string name in valueNames)
            {
                if (name == "Start")
                    return true;
            }

            return false;
        }

        /// <summary>
        /// Get local ip address
        /// </summary>
        /// <returns>ip address</returns>
        public static string GetLocIP()
        {
            IPHostEntry IpEntry = Dns.GetHostEntry(Dns.GetHostName());
            return IpEntry.AddressList.First(a => a.AddressFamily == AddressFamily.InterNetwork).ToString();
        }
        
        /// <summary>
        /// Verify whether program can connect database with given connection string.
        /// </summary>
        /// <param name="connectionString">given connection string</param>
        /// <returns>wheter can connect</returns>
        public static string tryConnectDBIntegrated(string connectionString,String UserName, string Domain, string Password)
        {
            SqlConnection conn = new SqlConnection(connectionString);
            Impersonator impersonator = new Impersonator(UserName, Domain, Password);
                        
            try
            {
                impersonator.Impersonate();

                bool isReportServerDB = ConfigToolHelper.isReportServerDB(conn);
                //if (!isReportServerDB)
                //    return String.Format(StaticMessages.databaseConnectionFail, StaticMessages.notReportServerDB);
            }
            catch (Exception error)
            {
                return String.Format(StaticMessages.databaseConnectionFail, error.Message);
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                    conn.Close();
                if (impersonator != null)
                    impersonator.Undo();
            }

            return StaticMessages.testSuccess;
        }

        /// <summary>
        /// Verify whether program can connect database with given connection string.
        /// </summary>
        /// <param name="connectionString">given connection string</param>
        /// <returns>wheter can connect</returns>
        public static string UpdateSchema(string connectionString, String UserName, string Domain, string Password, bool IsIntegrated)
        {
            SqlConnection conn = new SqlConnection(connectionString);
            Impersonator impersonator = new Impersonator(UserName, Domain, Password);

            try
            {
                if (IsIntegrated)
                    impersonator.Impersonate();

                
                 string SQL;
                 if (isReportServerDB(conn))
                 {

                     SQL = @"

                           DECLARE @DBVersion varchar(200) 
                           DECLARE @DBVersionPrev varchar(200) 
                           
                            IF NOT EXISTS(SELECT * FROM sysobjects WHERE type = 'u' AND name = 'ForerunnerDBVersion')
                            BEGIN	                            
	                            CREATE TABLE dbo.ForerunnerDBVersion (Version varchar(200) NOT NULL,PreviousVersion varchar(200) NOT NULL, PRIMARY KEY (Version))  
                                INSERT ForerunnerDBVersion (Version,PreviousVersion) SELECT '1.3','0'
                            END


                           SELECT @DBVersion = Version, @DBVersionPrev =PreviousVersion  FROM ForerunnerDBVersion                                                        
                            


                           IF NOT EXISTS(SELECT * FROM sysobjects WHERE type = 'u' AND name = 'ForerunnerCatalog')
                            BEGIN	                            
	                            CREATE TABLE dbo.ForerunnerCatalog (ItemID uniqueidentifier NOT NULL,UserID uniqueidentifier NULL ,ThumbnailImage image NULL, SaveDate datetime NOT NULL,CONSTRAINT uc_PK UNIQUE (ItemID,UserID))  
                            END
                           IF NOT EXISTS(SELECT * FROM sysobjects WHERE type = 'u' AND name = 'ForerunnerFavorites')
                            BEGIN	                            	                            
                                CREATE TABLE dbo.ForerunnerFavorites(ItemID uniqueidentifier NOT NULL,UserID uniqueidentifier NOT NULL,PRIMARY KEY (ItemID,UserID))
                            END
                           IF NOT EXISTS(SELECT * FROM sysobjects WHERE type = 'u' AND name = 'ForerunnerUserItemProperties')
                            BEGIN	                            	                            
                                CREATE TABLE dbo.ForerunnerUserItemProperties(ItemID uniqueidentifier NOT NULL,UserID uniqueidentifier NULL, SavedParameters varchar(max), CONSTRAINT uip_PK UNIQUE (ItemID,UserID))
                            END
                           IF NOT EXISTS(SELECT * FROM sysobjects WHERE type = 'u' AND name = 'ForerunnerUserSettings')
                            BEGIN	                            	                            
                                CREATE TABLE dbo.ForerunnerUserSettings(UserID uniqueidentifier NOT NULL, Settings varchar(max), PRIMARY KEY (UserID))
                            END
                           IF NOT EXISTS(SELECT * FROM sysobjects WHERE type = 'u' AND name = 'ForerunnerSubscriptions')
                            BEGIN	                            	                            
                                CREATE TABLE dbo.ForerunnerSubscriptions(SubscriptionID uniqueidentifier NOT NULL, ScheduleID uniqueidentifier not null, ItemID uniqueidentifier NOT NULL)
                            END
                           IF NOT EXISTS(SELECT * FROM sysobjects WHERE type = 'u' AND name = 'ForerunnerItemTags')
                            BEGIN	                            	                            
                                CREATE TABLE dbo.ForerunnerItemTags(ItemID uniqueidentifier NOT NULL, Tags varchar(200) NOT NULL, PRIMARY KEY (ItemID))
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

                            IF @DBVersion <> '1.3'
                                UPDATE ForerunnerDBVersion SET PreviousVersion = Version, Version = '1.3'  FROM ForerunnerDBVersion
                             
                            ";
                 }
                 else
                 {
                     SQL = @"
                            DECLARE @DBVersion varchar(200) 
                            DECLARE @DBVersionPrev varchar(200) 
                           
                            IF NOT EXISTS(SELECT * FROM sysobjects WHERE type = 'u' AND name = 'ForerunnerDBVersion')
                            BEGIN	                            
	                            CREATE TABLE dbo.ForerunnerDBVersion (Version varchar(200) NOT NULL,PreviousVersion varchar(200) NOT NULL, PRIMARY KEY (Version))  
                                INSERT ForerunnerDBVersion (Version,PreviousVersion) SELECT 'S.1.3','0'
                            END


                            SELECT @DBVersion = Version, @DBVersionPrev =PreviousVersion  FROM ForerunnerDBVersion                                                        
                            


                            IF NOT EXISTS(SELECT * FROM sysobjects WHERE type = 'u' AND name = 'ForerunnerCatalog')
                            BEGIN	                            
	                            CREATE TABLE dbo.ForerunnerCatalog (ItemID nvarchar(425) NOT NULL,UserID nvarchar(260) NULL ,ThumbnailImage image NULL, SaveDate datetime NOT NULL,CONSTRAINT uc_PK UNIQUE (ItemID,UserID))  
                            END
                            IF NOT EXISTS(SELECT * FROM sysobjects WHERE type = 'u' AND name = 'ForerunnerFavorites')
                            BEGIN	                            	                            
                                CREATE TABLE dbo.ForerunnerFavorites(ItemID nvarchar(425)  NOT NULL,UserID nvarchar(260) NOT NULL,PRIMARY KEY (ItemID,UserID))
                            END
                            IF NOT EXISTS(SELECT * FROM sysobjects WHERE type = 'u' AND name = 'ForerunnerUserItemProperties')
                            BEGIN	                            	                            
                                CREATE TABLE dbo.ForerunnerUserItemProperties(ItemID nvarchar(425)  NOT NULL,UserID nvarchar(260) NULL, SavedParameters varchar(max), CONSTRAINT uip_PK UNIQUE (ItemID,UserID))
                            END
                            IF NOT EXISTS(SELECT * FROM sysobjects WHERE type = 'u' AND name = 'ForerunnerUserSettings')
                            BEGIN	                            	                            
                                CREATE TABLE dbo.ForerunnerUserSettings(UserID nvarchar(260) NOT NULL, Settings varchar(max), PRIMARY KEY (UserID))
                            END
                            IF NOT EXISTS(SELECT * FROM sysobjects WHERE type = 'u' AND name = 'ForerunnerSubscriptions')
                            BEGIN	                            	                            
                                CREATE TABLE dbo.ForerunnerSubscriptions(SubscriptionID uniqueidentifier NOT NULL, ScheduleID uniqueidentifier not null, ItemID nvarchar(425)  NOT NULL)
                            END
                            IF NOT EXISTS(SELECT * FROM sysobjects WHERE type = 'u' AND name = 'ForerunnerItemTags')
                            BEGIN	                            	                            
                                CREATE TABLE dbo.ForerunnerItemTags(ItemID nvarchar(425)  NOT NULL, Tags varchar(200) NOT NULL, PRIMARY KEY (ItemID))
                            END

                            
                            IF @DBVersionPrev ='S.1.2' 
                                BEGIN
                                    ALTER TABLE ForerunnerCatalog ALTER COLUMN ThumbnailImage Image NULL
                                    SELECT @DBVersionPrev = 'S.1.3'
                                END

                            IF @DBVersion <> 'S.1.3'
                                UPDATE ForerunnerDBVersion SET PreviousVersion = Version, Version = 'S.1.3'  FROM ForerunnerDBVersion

                        ";
                 }
                conn.Open();
                using (SqlCommand SQLComm = new SqlCommand(SQL, conn))
                {
                    SQLComm.ExecuteNonQuery();
                }
            }
         
               
            catch (Exception error)
            {
                return String.Format(StaticMessages.databaseConnectionFail, error.Message);
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                    conn.Close();
                if (impersonator != null)
                    impersonator.Undo();
            }

            return StaticMessages.testSuccess;
        }

        private static bool isReportServerDB(SqlConnection conn)
        {
            conn.Open();
            string SQL = "SELECT * FROM sysobjects WHERE name = 'ExecutionLogStorage'";

            SqlCommand cmd = new SqlCommand(SQL, conn);
            SqlDataReader rdr = cmd.ExecuteReader();
            if (!rdr.Read())
            {
                conn.Close();
                return false;
            }
            conn.Close();
            return true;
        }

        /// <summary>
        /// Verify whether program can connect database with given connection string.
        /// </summary>
        /// <param name="connectionString">given connection string</param>
        /// <returns>wheter can connect</returns>
        public static string tryConnectDB(string connectionString)
        {
            SqlConnection conn = new SqlConnection(connectionString);
            try
            {
                bool isReportServerDB = ConfigToolHelper.isReportServerDB(conn);
                //if (!isReportServerDB)
                //    return String.Format(StaticMessages.databaseConnectionFail, StaticMessages.notReportServerDB);
            }
            catch (Exception error)
            {
                return String.Format(StaticMessages.databaseConnectionFail, error.Message);
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                    conn.Close();
            }

            return StaticMessages.testSuccess;
        }

        /// <summary>
        /// Detect the given report service web service url is available or not
        /// </summary>
        /// <param name="isSharePoint">Native mode or SharePoint mode</param>
        /// <param name="url">Web Service Url</param>
        /// <returns>True: web service url is available; ErrorMessage</returns>
        public static string tryWebServiceUrl(bool isSharePoint, string url)
        {
            try
            {
                url += isSharePoint ? StaticMessages.ssrs2006url : StaticMessages.ssrs2005url;
                
                HttpWebRequest request = WebRequest.Create(url) as HttpWebRequest;
                request.Credentials = CredentialCache.DefaultNetworkCredentials;
                using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
                {
                    //return content type should be text/xml
                    if (response.ContentType.Contains("text/xml"))
                    {
                        XmlDocument wsdl = new XmlDocument();
                        wsdl.Load(response.GetResponseStream());

                        string namespaceUri = wsdl.DocumentElement.NamespaceURI;
                        XmlNamespaceManager nsmgr = new XmlNamespaceManager(wsdl.NameTable);
                        nsmgr.AddNamespace("wsdl", namespaceUri);

                        string targetNamespace = wsdl.SelectSingleNode("wsdl:definitions", nsmgr).Attributes["targetNamespace"].Value;

                        if (targetNamespace.Equals(isSharePoint ? StaticMessages.ssrs2006TargetNS : StaticMessages.ssrs2005TargetNS))
                        {
                            return StaticMessages.testSuccess;
                        }
                    }
                    return StaticMessages.webServiceUrlIncorrect;
                }
            }
            catch (WebException e) 
            {
                if (e.Response == null)
                {
                    return String.Format(StaticMessages.webServiceUrlInvalid, e.Message);
                }
                else
                {
                    var response = (HttpWebResponse)e.Response;
                    string description = response.StatusDescription;

                    e.Response.Close();
                    return String.Format(StaticMessages.webServiceUrlError, description);
                }
            }
            catch (Exception e) 
            {
                return String.Format(StaticMessages.webServiceUrlInvalid, e.Message);
            }
        }

        /// <summary>
        /// Start a service specified by a service name. Then it waits until the service is running or a timeout occurs.
        /// </summary>
        /// <param name="serviceName">service name</param>
        /// <param name="timeoutMilliseconds">timeout millisecond</param>
        /// <returns>success or not</returns>
        public static bool StartService(string serviceName, int timeoutMilliseconds)
        {
            ServiceController service = new ServiceController(serviceName);
            try
            {
                TimeSpan timeout = TimeSpan.FromMilliseconds(timeoutMilliseconds);
                
                service.Start();
                service.WaitForStatus(ServiceControllerStatus.Running, timeout);
            }
            catch
            {
                return false;
            }
            return true;
        }

        /// <summary>
        /// Stop the specified service and it waits until the service is stopped or a timeout occurs.
        /// </summary>
        /// <param name="serviceName">service name</param>
        /// <param name="timeoutMilliseconds">timeout millisecond</param>
        /// <returns>success or not</returns>
        public static bool StopService(string serviceName, int timeoutMilliseconds)
        {
            ServiceController service = new ServiceController(serviceName);
            try
            {
                TimeSpan timeout = TimeSpan.FromMilliseconds(timeoutMilliseconds);

                if (service.CanStop)
                {
                    service.Stop();
                    service.WaitForStatus(ServiceControllerStatus.Stopped, timeout);
                }
                else
                    return false;
            }
            catch
            {
                return false;
            }
            return true;
        }

        /// <summary>
        /// Get Report Server Instance name from selected ReportServer Path
        /// </summary>
        /// <param name="reportServerUrl">report server path</param>
        /// <returns>report service name</returns>
        public static string GetReportServerInstance(string reportServerUrl)
        {
            string reportServer = "ReportServer";
            string server = reportServerUrl.Substring(reportServerUrl.IndexOf("MSRS"));
            string instanceName = server.Substring(server.IndexOf('.') + 1, server.IndexOf('\\') - server.IndexOf('.') - 1);
            
            if (instanceName.Equals("MSSQLSERVER", StringComparison.OrdinalIgnoreCase))
            {
                return reportServer;
            }
            else
            {
                return reportServer + "$" + instanceName;
            }
        }

        /// <summary>
        /// Start or Stop Report Server
        /// </summary>
        /// <param name="isStart">True:Start; False:Stop</param>
        /// <param name="targetPath">Report Server Folder Path</param>
        /// <returns></returns>
        public static bool StartReportServer(bool isStart, string targetPath) 
        {
            try
            {
                string instanceName = GetReportServerInstance(targetPath);

                if (isStart)
                {
                    return StartService(instanceName, 1000 * 30);
                }
                else
                {
                    return StopService(instanceName, 1000 * 30);
                }
            }
            catch
            {
                return false;
            }       
        }

        /// <summary>
        /// Set config node value.
        /// </summary>
        /// <param name="key"></param>
        /// <param name="value"></param>
        public static void SetAppConfig(string key, string value)
        {
            Configuration config = ConfigurationManager.OpenExeConfiguration(ConfigurationUserLevel.None);
            config.AppSettings.Settings[key].Value = value;
            config.Save(ConfigurationSaveMode.Modified);
            ConfigurationManager.RefreshSection("appSettings");   
        }

        /// <summary>
        /// Get config node value.
        /// </summary>
        /// <param name="key"></param>
        /// <returns></returns>
        public static string GetAppConfig(string key)
        {
            return ConfigurationManager.AppSettings[key];
        }

        /// <summary>
        /// 
        /// </summary>
        public static void SetLogFilesFolderPermission(bool isIIS)
        {
            //For release build folder path
            string path = System.Environment.CurrentDirectory + @"\..\..\LogFiles";
            //For visual studio folder path
            //string path = System.Environment.CurrentDirectory + @"\..\..\..\LogFiles";
            SetFolderPermission(path, isIIS ? StaticMessages.IISUsrsAccount : StaticMessages.NetworkServiceAccount, FileSystemRights.Write);
        }

        private static void SetFolderPermission(string folderPath, string username, FileSystemRights level)
        {
            if (!Directory.Exists(folderPath)) 
                Directory.CreateDirectory(folderPath);

            DirectoryInfo dirInfo = new DirectoryInfo(folderPath);
            DirectorySecurity dirSecurity = dirInfo.GetAccessControl();
            dirSecurity.AddAccessRule(new FileSystemAccessRule(username, level, AccessControlType.Allow));
            dirInfo.SetAccessControl(dirSecurity);
        }

        private static void RemoveFolderPermission(string folderPath, string username, FileSystemRights level)
        {
            DirectoryInfo dirInfo = new DirectoryInfo(folderPath);
            DirectorySecurity dirSecurity = dirInfo.GetAccessControl();
            dirSecurity.RemoveAccessRule(new FileSystemAccessRule(username, level, AccessControlType.Allow));
            dirInfo.SetAccessControl(dirSecurity);
        }
    }
}
