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
            if (ValidateUserNameAndAuthority(userName, SAMLResponse, authority))
            {
                AsymmetricAlgorithm key = GetPublicKey(authority);

                // If the certificate for this authority is not in our database, return false.
                if (key != null)
                {
                    // Make sure that the saml response matches the signature
                    // And the key in the signature matches what is in our database.
                    if (VerifyXml(SAMLResponse, key))
                    {
                        return VerifyUserAndAuthority(userName, authority);
                    }
                }
            }

            return false;
        }

        /// <summary>
        /// This method verfies if the xmlstring has a valid signature.
        /// If signedCms is not null, we will check if the public key matches the signing key of the xml string.
        /// </summary>
        /// <param name="xmlstring">The xml string with a signature to validate.</param>
        /// <param name="key">Expected public key.</param>
        /// <returns></returns>
        public static bool VerifyXml(string xmlstring, AsymmetricAlgorithm key)
        {
            // Create a new XML document.
            XmlDocument xmlDocument = new XmlDocument();

            // Format using white spaces.
            xmlDocument.PreserveWhitespace = true;

            // LoadXml the passed XML string into the document. 
            xmlDocument.LoadXml(xmlstring);

            // Create a new SignedXml object and pass it 
            // the XML document class.
            SignedXml signedXml = new SignedXml(xmlDocument);

            // Find the "Signature" node and create a new 
            // XmlNodeList object.
            XmlNodeList nodeList = xmlDocument.GetElementsByTagName("Signature");

            if (nodeList != null && nodeList.Count > 0)
            {
                // Load the signature node.
                signedXml.LoadXml((XmlElement)nodeList[0]);

                // Check the signature and return the result. 
                if (key != null)
                {
                    return signedXml.CheckSignature(key);
                }
                else
                {
                    return signedXml.CheckSignature();
                }
            }

            return false;
        }

        /// <summary>
        /// This method is for 2.0.  Override this in the subclass for 1.1.
        /// </summary>
        public static void GetUserNameAndAuthorityFromResponse(string samlResponse, out string userNameExtracted, out string authorityExtracted)
        {
            XmlDocument doc = new XmlDocument();
            doc.LoadXml(samlResponse);
            var ns = new XmlNamespaceManager(doc.NameTable);
            ns.AddNamespace("samlp", @"urn:oasis:names:tc:SAML:2.0:protocol");
            ns.AddNamespace("saml", @"urn:oasis:names:tc:SAML:2.0:assertion");
            ns.AddNamespace("ds", SignedXml.XmlDsigNamespaceUrl);
            XmlNode nameIDNode = doc.SelectSingleNode(
                "/samlp:Response/saml:Assertion/saml:Subject/saml:NameID", ns);
            XmlNode issuerNode = doc.SelectSingleNode(
                "/samlp:Response/saml:Issuer", ns);
            userNameExtracted = nameIDNode.InnerText;
            authorityExtracted = issuerNode.InnerText;
        }

        /// <summary>
        /// This method checks the user name and authority against the fields in the saml response.
        /// This method is only made protected so that I can unit test.
        /// </summary>
        /// <param name="userName">User name</param>
        /// <param name="samlResponse">SAML response</param>
        /// <param name="authority">Authority</param>
        /// <returns>Whether the user name and authority extracted match the expected.</returns>
        protected static bool ValidateUserNameAndAuthority(string userName, string samlResponse, string authority)
        {
            string userNameExtracted;
            string authorityExtracted;
            GetUserNameAndAuthorityFromResponse(samlResponse, out userNameExtracted, out authorityExtracted);
            return userName.Equals(userNameExtracted) && authority.Equals(authorityExtracted);
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
