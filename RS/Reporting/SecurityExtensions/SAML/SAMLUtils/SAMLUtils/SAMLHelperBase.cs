namespace ForeRunner.Reporting.Extensions.SAMLUtils
{
    using System;
    using System.Configuration;
    using System.Data;
    using System.Data.SqlClient;
    using System.Globalization;
    using System.IO;
    using System.IO.Compression;
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
            return DatabaseHelper.CheckUserExists(userName, authority);
        }

        /// <summary>
        /// This method gets the certificate from the DB.
        /// </summary>
        /// <param name="authority"></param>
        /// <returns></returns>
        public static X509Certificate2 GetCertificateFromDB(string authority)
        {
            string certString = DatabaseHelper.getPropertyByAuthority(authority, "sp_GetCertificate", "Failed to load certificate for authority");
            return new X509Certificate2(Encoding.UTF8.GetBytes(certString));
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
            return DatabaseHelper.getPropertyByAuthority(authority, "sp_GetIDPUrl", "Failed to load IDP Url for authority");
        }

        public static byte[] inflateIfNeeded(byte[] inputStream)
        {
            if (CheckIsCompressed.IsGZip(inputStream)) 
            {
                using (GZipStream stream = new GZipStream(new MemoryStream(inputStream), CompressionMode.Decompress))
                {
                    const int size = 4096;
                    byte[] buffer = new byte[size];
                    using (MemoryStream memory = new MemoryStream())
                    {
                        int count = 0;
                        do
                        {
                            count = stream.Read(buffer, 0, size);
                            if (count > 0)
                            {
                                memory.Write(buffer, 0, count);
                            }
                        }
                        while (count > 0);
                        return memory.ToArray();
                    }
                }
            }

            return inputStream;
        }
    }
}
