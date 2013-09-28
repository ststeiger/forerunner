using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data.SqlClient;
using System.Configuration;

namespace ForerunnerWebService
{
    public class ForerunnerDB
    {
        private SqlConnection SQLCon = null;
        
        private static string DataSourse = ConfigurationManager.AppSettings["DataSourse"];
        private static string InitialCatalog = ConfigurationManager.AppSettings["InitialCatalog"];
        private static string UserID = ConfigurationManager.AppSettings["UserID"];
        private static string Password = ConfigurationManager.AppSettings["Password"];

        public SqlConnection GetSQLConn()
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

        static private bool CheckLicenseID(string ID)
        {
            string SQL = "SELECT LicenseID FROM License WHERE LicenseID = @ID";
            bool retval = true;
            SqlDataReader SQLReader;
            ForerunnerDB DB = new ForerunnerDB();
            SqlConnection SQLConn = DB.GetSQLConn(); ;
            
            SQLConn.Open();
            SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
            SQLComm.Parameters.AddWithValue("@ID", ID);

            SQLReader = SQLComm.ExecuteReader();            
            if (SQLReader.Read())
            {
                retval = false;
            }
            SQLReader.Close();
            SQLConn.Close();
            return retval;
        }
        static public string NewLicenseID()
        {
            string ID = GetNewID();

            while (!ForerunnerDB.CheckLicenseID(ID))
                ID = GetNewID();
            return ID;

        }

        private static string GetNewID()
        {
            string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789";
            string id = "";
            byte[] bytes1 = new byte[6];
            Random rnd = new Random();

            rnd.NextBytes(bytes1);
            for (int i = 0; i < 6; i++)
            {
                id += chars[bytes1[i] % 61];
            }
            return id;
        }

    }
}