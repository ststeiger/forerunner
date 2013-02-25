using System;
using System.Security.Cryptography.Xml;
using System.Xml;

namespace ForeRunner.Reporting.Extensions.SAMLUtils
{
    public class SAMLResponseHelper
    {
        private string userName;
        private XmlDocument doc = new XmlDocument();
        private string authority;
        private TenantInfo tenantInfo;
        private XmlNamespaceManager ns;

        public SAMLResponseHelper(string userName, string samlResponse, string authority, TenantInfo tenantInfo)
        {
            this.userName = userName;
            doc.LoadXml(samlResponse);
            doc.PreserveWhitespace = true; ;
            ns = new XmlNamespaceManager(doc.NameTable);
            ns.AddNamespace("samlp", @"urn:oasis:names:tc:SAML:2.0:protocol");
            ns.AddNamespace("saml", @"urn:oasis:names:tc:SAML:2.0:assertion");
            ns.AddNamespace("ds", SignedXml.XmlDsigNamespaceUrl);
            this.authority = authority;
            this.tenantInfo = tenantInfo;
        }

        public bool IsValid()
        {
            if (ValidateUserNameAndAuthority())
            {
                return VerifyXml();
            }
            return false;
        }

        public void GetNameIDAndIssuerFromResponse(out string nameIdExtracted, out string issuerNameExtracted)
        {
            XmlNode nameIDNode = doc.SelectSingleNode(
                "/samlp:Response/saml:Assertion/saml:Subject/saml:NameID", ns);
            XmlNode issuerNode = doc.SelectSingleNode(
                "/samlp:Response/saml:Issuer", ns);
            nameIdExtracted = nameIDNode.InnerText;
            issuerNameExtracted = issuerNode.InnerText;
        }

        private bool VerifyXml()
        {
            // Create a new SignedXml object and pass it 
            // the XML document class.
            SignedXml signedXml = new SignedXml(doc);

            // Find the "Signature" node and create a new 
            // XmlNodeList object.
            XmlNodeList nodeList = doc.GetElementsByTagName("Signature");

            if (nodeList != null && nodeList.Count > 0)
            {
                // Load the signature node.
                signedXml.LoadXml((XmlElement)nodeList[0]);

                // Check the signature and return the result. 
                if (tenantInfo.Key != null)
                {
                    return signedXml.CheckSignature(tenantInfo.Key);
                }
                else
                {
                    return signedXml.CheckSignature();
                }
            }

            return false;
        }

        private bool ValidateUserNameAndAuthority()
        {
            string nameIdExtracted;
            string issuerExtracted;
            GetNameIDAndIssuerFromResponse(out nameIdExtracted, out issuerExtracted);
            return userName.StartsWith(authority + ".") && userName.Equals(SAMLHelperBase.GetUserName(authority, nameIdExtracted), StringComparison.InvariantCultureIgnoreCase);
        }
    }
}
