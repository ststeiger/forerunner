using System;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using Microsoft.Win32;
using Forerunner.Security;

namespace ReportMannagerConfigTool
{
    public class ConfigToolHelper
    {
        /// <summary>
        /// Detect whether IIS web server installed on the machine
        /// </summary>
        /// <returns>True: installed; False: not</returns>
        public bool isIISInstalled()
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
        public bool isUWSInstalled()
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
        public string GetLocIP()
        {
            IPHostEntry IpEntry = Dns.GetHostEntry(Dns.GetHostName());
            return IpEntry.AddressList.First(a => a.AddressFamily == AddressFamily.InterNetwork).ToString();
        }
        
        /// <summary>
        /// Verify whether program can connect database with given connection string.
        /// </summary>
        /// <param name="connectionString">given connection string</param>
        /// <returns>wheter can connect</returns>
        public string tryConnectDBIntegrated(string connectionString,String UserName, string Domain, string Password)
        {
            SqlConnection conn = new SqlConnection(connectionString);
            Impersonator impersonator = new Impersonator(UserName, Domain, Password);
            impersonator.Impersonate();            
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
        public string tryConnectDB(string connectionString)
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
    }
}
