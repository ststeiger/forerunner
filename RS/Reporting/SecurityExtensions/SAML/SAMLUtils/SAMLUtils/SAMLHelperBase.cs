namespace ForeRunner.Reporting.Extensions.SAMLUtils
{
    using System;
    using System.Security.Cryptography;
    using System.Security.Cryptography.Pkcs;
    using System.Security.Cryptography.X509Certificates;
    using System.Security.Cryptography.Xml;
    using System.Xml;

    /// <summary>
    /// This class provides the basic helper functions that would
    /// make a SAML Request to the IDP and also provide the response
    /// validation that will be called by the ACS via the security extension's
    /// LogonUser method.
    /// </summary>
    public class SAMLHelperBase
    {
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
            // TODO:  Make sure that we query the DB to ensure the user does indeed have access to RS
            return false;
        }

        /// <summary>
        /// This method gets the certificate from the DB.
        /// </summary>
        /// <param name="authority"></param>
        /// <returns></returns>
        private static byte[] GetCertificateFromDB(string authority)
        {
            // TODO:  Make the call to the DB to load the certificate blob for the given authority
            return null;
        }

        /// <summary>
        /// This method get the public key for the given authority from the DB.
        /// </summary>
        /// <param name="authority"></param>
        /// <returns></returns>
        private static AsymmetricAlgorithm GetPublicKey(string authority) 
        {
            // Based on the authority in the Xml, look up the signing key from the database.
            byte[] blob = GetCertificateFromDB(authority);
            X509Certificate2 cert = new X509Certificate2(blob);
            return cert.PublicKey.Key;
        }
    }
}
