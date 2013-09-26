using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data.SqlClient;
using System.Configuration;

namespace ForerunnerWebService
{
    static public class ForerunnerDB
    {
        private static SqlConnection SQLCon = null;
        
        private static string DataSourse = ConfigurationManager.AppSettings["DataSourse"];
        private static string InitialCatalog = ConfigurationManager.AppSettings["InitialCatalog"];
        private static string UserID = ConfigurationManager.AppSettings["UserID"];
        private static string Password = ConfigurationManager.AppSettings["Password"];

        static public SqlConnection GetSQLConn()
        {
            if (SQLCon == null)
            {
                SQLCon = new SqlConnection();
                SqlConnectionStringBuilder builder = new SqlConnectionStringBuilder();
                builder.DataSource = DataSourse;
                builder.InitialCatalog = InitialCatalog;
                builder.UserID = UserID;
                builder.Password = Password;
                SQLCon.ConnectionString = builder.ConnectionString;
            }

            return SQLCon;
        }


    }
}