using System;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Globalization;
using System.Text;

namespace ForeRunner.Reporting.Extensions.SAMLUtils
{
    public class DatabaseHelper
    {
        public static string GetConnectionString()
        {
            return ConfigurationManager.ConnectionStrings["ForeRunnerSAMLExtension.ConnectionString"].ConnectionString;
        }

        public static void loadCertificate(string authority, string certificateBlob)
        {
            loadSomethingToDB(authority, certificateBlob, "sp_LoadCertificate", "@CertificateBlob", "Failed to load certificate");
        }

        public static void loadIDPUrl(string authority, string url)
        {
            loadSomethingToDB(authority, url, "sp_SetIDPUrl", "@IDPUrl", "Failed to load idp url");
        }

        public static void addReportingUser(string authority, string nameID)
        {
            loadSomethingToDB(authority, nameID, "sp_AddReportingUser", "@NameID", "Failed to addReportingUser");
        }

        internal static string getPropertyByAuthority(string authority, string spName, string errorString)
        {
            using (SqlConnection connection = new SqlConnection(GetConnectionString()))
            {
                SqlCommand cmd = new SqlCommand(spName, connection);
                cmd.CommandType = CommandType.StoredProcedure;

                SqlParameter sqlParam = cmd.Parameters.Add("@Authority",
                                                    SqlDbType.VarChar,
                                                    256);
                sqlParam.Value = authority;
                try
                {
                    connection.Open();
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        reader.Read(); // Advance to the one and only row
                        // Return output parameters from returned data stream
                        return reader.GetString(0);
                    }
                }
                catch (Exception ex)
                {
                    throw new Exception(string.Format(CultureInfo.InvariantCulture,
                        errorString + "\r\n" + ex.Message));
                }
            }
        }

        internal static bool CheckUserExists(string userName, string authority)
        {
            using (SqlConnection connection = new SqlConnection(GetConnectionString()))
            {
                SqlCommand cmd = new SqlCommand("sp_CheckUserExists", connection);
                cmd.CommandType = CommandType.StoredProcedure;

                SqlParameter sqlParam = cmd.Parameters.Add("@UserName",
                                                    SqlDbType.VarChar,
                                                    256);
                sqlParam.Value = userName;
                try
                {
                    connection.Open();
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        reader.Read(); // Advance to the one and only row
                        // Return output parameters from returned data stream
                        string userNameInDB = reader.GetString(0);
                        if (userNameInDB == null || !userNameInDB.StartsWith(authority == null ? "" : authority))
                        {
                            return false;
                        }
                        return String.Compare(userName, userNameInDB, true) == 0;
                    }
                }
                catch (Exception ex)
                {
                    throw new Exception(string.Format(CultureInfo.InvariantCulture,
                        "Failed to verify user" + ex.Message));
                }
            }
        }

        private static void loadSomethingToDB(string authority, string stringValue, string spName, string paramName, string errorString)
        {
            using (SqlConnection connection = new SqlConnection(GetConnectionString()))
            {
                SqlCommand cmd = new SqlCommand(spName, connection);
                cmd.CommandType = CommandType.StoredProcedure;

                SqlParameter sqlParam = cmd.Parameters.Add("@Authority",
                                                    SqlDbType.VarChar,
                                                    256);
                sqlParam.Value = authority;
                sqlParam = cmd.Parameters.Add(paramName,
                                                    SqlDbType.VarChar,
                                                    2048);
                sqlParam.Value = stringValue;
                try
                {
                    connection.Open();
                    cmd.ExecuteNonQuery();
                }
                catch (Exception ex)
                {
                    throw new Exception(string.Format(CultureInfo.InvariantCulture,
                         errorString + "\r\n" + ex.Message));
                }
            }
        }
    }
}
