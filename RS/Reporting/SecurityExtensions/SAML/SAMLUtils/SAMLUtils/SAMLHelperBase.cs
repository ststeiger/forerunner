namespace ForeRunner.Reporting.Extensions.SAMLUtils
{
    using System;
    using System.Configuration;
    using System.Data;
    using System.Data.SqlClient;
    using System.Globalization;
    using System.Security.Cryptography;
    using System.Security.Cryptography.Pkcs;
    using System.Security.Cryptography.X509Certificates;
    using System.Security.Cryptography.Xml;
    using System.Text;
    using System.Text.RegularExpressions;
    using System.Xml;

    /// <summary>
    /// This class provides the basic helper functions that would
    /// make a SAML Request to the IDP and also provide the response
    /// validation that will be called by the ACS via the security extension's
    /// LogonUser method.
    /// </summary>
    public class SAMLHelperBase
    {
        private static String GetConnectionString()
        {
            return ConfigurationManager.ConnectionStrings["ForeRunnerSAMLExtension.ConnectionString"].ConnectionString;
        }

        private static String GetRegExString()
        {
            return ConfigurationManager.AppSettings["ForeRunnerSAMLExtension.TenantAuthorityRegEx"];
        }

        /// <summary>
        /// This method extracts the authority from the Url
        /// </summary>
        /// <param name="url"></param>
        /// <returns></returns>
        public static string GetAuthorityFromUrl(string url)
        {
            Match match = Regex.Match(url, GetRegExString(),
                RegexOptions.IgnoreCase);

            // Here we check the Match instance.
            if (match.Success)
            {
                return match.Groups[1].Value;
            }
            return null;
        }

        /// <summary>
        /// This method verifies the SAML Response that came back from the IDP.
        /// </summary>
        /// <param name="userName">User name</param>
        /// <param name="SAMLResponse">Saml response</param>
        /// <param name="authority">Authority</param>
        /// <returns>Whether the SAML is valid</returns>
        public static bool VerifySAMLResponse(string userName, string SAMLResponse, string authority)
        {
            TenantInfo tenantInfo = new TenantInfo(GetPublicKey(authority), null);
            SAMLResponseHelper responseHelper = new SAMLResponseHelper(userName, SAMLResponse, authority, tenantInfo);
            if (responseHelper.IsValid())
            {              
                return VerifyUserAndAuthority(userName, authority);
            }

            return false;
        }

        /// <summary>
        /// Calls the DB to make sure that the given user and authority does indeed have
        /// access to RS.
        /// </summary>
        public static bool VerifyUserAndAuthority(string userName, string authority)
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
                        if (userNameInDB == null || !userNameInDB.StartsWith(authority))
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

        /// <summary>
        /// This method gets the certificate from the DB.
        /// </summary>
        /// <param name="authority"></param>
        /// <returns></returns>
        private static X509Certificate2 GetCertificateFromDB(string authority)
        {
            using (SqlConnection connection = new SqlConnection(GetConnectionString()))
            {
                SqlCommand cmd = new SqlCommand("sp_GetCertificate", connection);
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
                        string certString = reader.GetString(0);
                        return new X509Certificate2(Encoding.UTF8.GetBytes(certString));
                    }
                }
                catch (Exception ex)
                {
                    throw new Exception(string.Format(CultureInfo.InvariantCulture,
                        "Failed to load certificate for authority" + ex.Message));
                }
            }
        }

        /// <summary>
        /// This method get the public key for the given authority from the DB.
        /// </summary>
        /// <param name="authority"></param>
        /// <returns></returns>
        private static AsymmetricAlgorithm GetPublicKey(string authority) 
        {
            // Based on the authority in the Xml, look up the signing key from the database.
            X509Certificate2 cert = GetCertificateFromDB(authority);
            return cert.PublicKey.Key;
        }

        /// <summary>
        /// Generate the user name based on the authority and the nameId
        /// </summary>
        /// <param name="authority"></param>
        /// <param name="nameId"></param>
        /// <returns></returns>
        public static string GetUserName(string authority, string nameId)
        {
            return authority + "." + nameId;
        }

        public static string GetIDPUrl(string authority)
        {
            using (SqlConnection connection = new SqlConnection(GetConnectionString()))
            {
                SqlCommand cmd = new SqlCommand("sp_GetIDPUrl", connection);
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
                        "Failed to load IDP Url for authority" + ex.Message));
                }
            }
        }
    }
}
