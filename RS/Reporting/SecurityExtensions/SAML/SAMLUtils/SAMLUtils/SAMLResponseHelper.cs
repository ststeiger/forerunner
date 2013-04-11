using System;
using System.Security.Cryptography;
using System.Security.Cryptography.Xml;
using System.Text;
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
            doc.PreserveWhitespace = true;
            doc.XmlResolver = null;

            this.userName = userName;
            doc.LoadXml(samlResponse);
            ns = new XmlNamespaceManager(doc.NameTable);
            ns.AddNamespace("samlp", @"urn:oasis:names:tc:SAML:2.0:protocol");
            ns.AddNamespace("saml", @"urn:oasis:names:tc:SAML:2.0:assertion");
            ns.AddNamespace("ds", SignedXml.XmlDsigNamespaceUrl);
            this.authority = authority;
            this.tenantInfo = tenantInfo;
        }

        public bool IsValid(bool skipTimeRangeCheck = false)
        {
            if (ValidateUserNameAndAuthority())
            {
                if (IsValidTimeRange() || skipTimeRangeCheck)
                {
                    return VerifyXml();
                }
            }
            return false;
        }

        public bool IsValidTimeRange()
        {
            DateTime notBefore;
            DateTime notOnOrAfter;
            GetNotBeforeAndNotOnOrAfter(out notBefore, out notOnOrAfter);
            DateTime now = DateTime.Now;

            return now.CompareTo(notBefore) >= 0 && now.CompareTo(notOnOrAfter) < 0;
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

        public void GetNotBeforeAndNotOnOrAfter(out DateTime notBefore, out DateTime notOnOrAfter)
        {
            XmlNode conditionsNode = doc.SelectSingleNode(
                "/samlp:Response/saml:Assertion/saml:Conditions", ns);
            String notBeforeString = conditionsNode.Attributes["NotBefore"].Value.ToString();
            String notOnOrAfterString = conditionsNode.Attributes["NotOnOrAfter"].Value.ToString();
            notBefore = (notBeforeString != null) ? DateTime.Parse(notBeforeString) : DateTime.MinValue;
            notOnOrAfter = (notOnOrAfterString != null) ? DateTime.Parse(notOnOrAfterString) : DateTime.MaxValue;   
        }

        // Sign an XML file and save the signature in a new file. 
        public static void SignXmlFile(string fileName, string signedFileName, AsymmetricAlgorithm Key)
        {
            // Create a new XML document.
            XmlDocument doc = new XmlDocument();

            // Format the document to ignore white spaces.
            doc.PreserveWhitespace = true;

            // Load the passed XML file using its name.
            doc.Load(new XmlTextReader(fileName));

            // Create a SignedXml object.
            SignedXml signedXml = new SignedXml(doc);

            // Add the key to the SignedXml document. 
            signedXml.SigningKey = Key;

            // Create a reference to be signed.
            Reference reference = new Reference();
            reference.Uri = "";

            // Add an enveloped transformation to the reference.
            XmlDsigEnvelopedSignatureTransform env = new XmlDsigEnvelopedSignatureTransform();
            reference.AddTransform(env);

            // Add the reference to the SignedXml object.
            signedXml.AddReference(reference);


            // Add an RSAKeyValue KeyInfo (optional; helps recipient find key to validate).
            KeyInfo keyInfo = new KeyInfo();
            keyInfo.AddClause(new RSAKeyValue((RSA)Key));
            signedXml.KeyInfo = keyInfo;

            // Compute the signature.
            signedXml.ComputeSignature();

            // Get the XML representation of the signature and save 
            // it to an XmlElement object.
            XmlElement xmlDigitalSignature = signedXml.GetXml();

            // Append the element to the XML document.
            doc.DocumentElement.AppendChild(doc.ImportNode(xmlDigitalSignature, true));

            // Save the signed XML document to a file specified 
            // using the passed string.
            XmlTextWriter xmltw = new XmlTextWriter(signedFileName, new UTF8Encoding(false));
            doc.WriteTo(xmltw);
            xmltw.Close();
        }

        private bool VerifyXml()
        {
            // Create a new SignedXml object and pass it 
            // the XML document class.
            SignedXml signedXml = new SignedXml(doc);

            // Find the "Signature" node and create a new 
            XmlNodeList nodeList = doc.SelectNodes(@"//*[local-name(.) = 'Signature' and namespace-uri(.) = 'http://www.w3.org/2000/09/xmldsig#']");
            //if (node != null)
            if (nodeList != null && nodeList.Count > 0)
            {
                foreach (XmlNode xmlNode in nodeList)
                {
                    if (xmlNode.ParentNode.Equals(doc.DocumentElement))
                    {
                        // Load the signature node.
                        signedXml.LoadXml((XmlElement)xmlNode);
                        //signedXml.LoadXml(node);

                        // Check the signature and return the result. 
                        return (tenantInfo.Key != null) ? signedXml.CheckSignature(tenantInfo.Key) : signedXml.CheckSignature();
                    }
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
