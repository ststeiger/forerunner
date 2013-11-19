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
using Forerunner.Security;
using Microsoft.Win32;

namespace ReportMannagerConfigTool
{
    public static class ConfigToolHelper
    {
        /// <summary>
        /// Detect whether IIS web server installed on the machine
        /// </summary>
        /// <returns>True: installed; False: not</returns>
        public static bool isIISInstalled()
        {
            //SOFTWARE\Microsoft\InetStp -- MajorVersion
            string[] valueNames;

            RegistryKey target = Registry.LocalMachine.OpenSubKey("SOFTWARE").OpenSubKey("Microsoft").OpenSubKey("InetStp");

            if (target == null)
                return false;

            valueNames = target.GetValueNames();
            foreach (string keyName in valueNames)
            {
                if (keyName == "MajorVersion")
                {
                    return true;
                }
            }

            return false;
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
                conn.Open();
            }
            catch (Exception error)
            {
                return error.Message;
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                    conn.Close();
                if (impersonator != null)
                    impersonator.Undo();
            }

            return "True";
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
                conn.Open();
            }
            catch (Exception error)
            {
                return error.Message;
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                    conn.Close();
            }

            return "True";
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
