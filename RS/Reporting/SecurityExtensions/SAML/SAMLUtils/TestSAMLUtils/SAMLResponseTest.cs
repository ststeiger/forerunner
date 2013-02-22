using System;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Xml;
using System.Security;
using System.Security.Cryptography;
using System.Security.Cryptography.Xml;
using ForeRunner.Reporting.Extensions.SAMLUtils;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace TestSAMLUtils
{
    [TestClass]
    public class SAMLResponseTest
    {
        // Sign an XML file and save the signature in a new file. 
        private void SignXmlFile(string fileName, string signedFileName, RSA Key)
        {
            // Create a new XML document.
            XmlDocument doc = new XmlDocument();

            // Format the document to ignore white spaces.
            doc.PreserveWhitespace = false;

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

        /// <summary>
        /// Call verifyXml and verify that the signature of the xml matched the xml.
        /// </summary>
        [TestMethod]
        [DeploymentItem("SampleSAMLResponse.xml")]
        public void TestHappyPath1()
        {
            // Generate a signing key.
            RSACryptoServiceProvider key = new RSACryptoServiceProvider();

            // Sign the XML that was just created and save it in a  
            // new file.
            SignXmlFile("SampleSAMLResponse.xml", "SignedSAMLResponse.xml", key);
            Trace.TraceInformation("XML file signed.");

            // Verify the signature of the signed XML.
            Trace.TraceInformation("Verifying signature...");
            using (StreamReader streamReader = new StreamReader("SignedSAMLResponse.xml"))
            {
                String text = streamReader.ReadToEnd();
                // Simulate the ACS
                SAMLResponseHelper responseHelper1 = new SAMLResponseHelper(null, text, null, null);
                string userName;
                string authority;
                // Simulate the extension
                responseHelper1.GetUserNameAndAuthorityFromResponse(out userName, out authority);
                SAMLResponseHelper responseHelper2 = new SAMLResponseHelper(userName, text, authority, new TenantInfo(null, null));
                Assert.IsTrue(responseHelper2.IsValid());
            }
        }

        /// <summary>
        /// Call verifyXml and verify that the xml is signed with the expected signing key.
        /// </summary>
        [TestMethod]
        [DeploymentItem("SampleSAMLResponse.xml")]
        public void TestHappyPath2()
        {
            // Generate a signing key.
            RSACryptoServiceProvider key = new RSACryptoServiceProvider();

            // Sign the XML that was just created and save it in a  
            // new file.
            SignXmlFile("SampleSAMLResponse.xml", "SignedSAMLResponse.xml", key);
            Trace.TraceInformation("XML file signed.");

            // Verify the signature of the signed XML.
            Trace.TraceInformation("Verifying signature...");
            using (StreamReader streamReader = new StreamReader("SignedSAMLResponse.xml"))
            {
                String text = streamReader.ReadToEnd();
                // Simulate the ACS
                SAMLResponseHelper responseHelper1 = new SAMLResponseHelper(null, text, null, null);
                string userName;
                string authority;
                // Simulate the extension
                responseHelper1.GetUserNameAndAuthorityFromResponse(out userName, out authority);

                Assert.IsTrue(userName.Equals(@"_242f88493449e639aab95dd9b92b1d04234ab84fd8"));
                Assert.IsTrue(authority.Equals(@"https://openidp.feide.no"));

                SAMLResponseHelper responseHelper2 = new SAMLResponseHelper(userName, text, authority, new TenantInfo(key, null));
                Assert.IsTrue(responseHelper2.IsValid());
            }
        }

        private void TamperSignedFile(String signedFileName)
        {
            XmlDocument doc = new XmlDocument();
            doc.Load(signedFileName);
            var ns = new XmlNamespaceManager(doc.NameTable);
            ns.AddNamespace("samlp", @"urn:oasis:names:tc:SAML:2.0:protocol");
            ns.AddNamespace("saml", @"urn:oasis:names:tc:SAML:2.0:assertion");
            ns.AddNamespace("ds", SignedXml.XmlDsigNamespaceUrl);
            XmlNode signNode = doc.SelectSingleNode(
                "/samlp:Response", ns);
            XmlElement newElement = doc.CreateElement("saml:Assertion");
            signNode.AppendChild(newElement);
            // Save the signed XML document to a file specified 
            // using the passed string.
            XmlTextWriter xmltw = new XmlTextWriter(signedFileName, new UTF8Encoding(false));
            doc.WriteTo(xmltw);
            xmltw.Close();
        }

        /// <summary>
        /// Tamper the signed message and make sure that verifyXml fails.
        /// </summary>
        [TestMethod]
        [DeploymentItem("SampleSAMLResponse.xml")]
        public void TestInvalidSignature()
        {
            // Generate a signing key.
            RSACryptoServiceProvider key = new RSACryptoServiceProvider();

            // Sign the XML that was just created and save it in a  
            // new file.
            SignXmlFile("SampleSAMLResponse.xml", "SignedSAMLResponse.xml", key);
            Trace.TraceInformation("XML file signed.");

            TamperSignedFile("SignedSAMLResponse.xml");
            // Verify the signature of the signed XML.
            Trace.TraceInformation("Verifying signature...");
            using (StreamReader streamReader = new StreamReader("SignedSAMLResponse.xml"))
            {
                String text = streamReader.ReadToEnd();

                // Simulate the ACS
                SAMLResponseHelper responseHelper1 = new SAMLResponseHelper(null, text, null, null);
                string userName;
                string authority;
                // Simulate the extension
                responseHelper1.GetUserNameAndAuthorityFromResponse(out userName, out authority);
                SAMLResponseHelper responseHelper2 = new SAMLResponseHelper(userName, text, authority, new TenantInfo(key, null));
                Assert.IsFalse(responseHelper2.IsValid());
            }
        }

        /// <summary>
        /// Make sure verifyXml fails when the signing key does not match the expected key.
        /// </summary>
        [TestMethod]
        [DeploymentItem("SampleSAMLResponse.xml")]
        public void TestIncorrectKey()
        {
            // Generate a signing key.
            RSACryptoServiceProvider key = new RSACryptoServiceProvider();

            // Sign the XML that was just created and save it in a  
            // new file.
            SignXmlFile("SampleSAMLResponse.xml", "SignedSAMLResponse.xml", key);
            Trace.TraceInformation("XML file signed.");

            // Verify the signature of the signed XML.
            Trace.TraceInformation("Verifying signature...");
            using (StreamReader streamReader = new StreamReader("SignedSAMLResponse.xml"))
            {
                String text = streamReader.ReadToEnd();
                // Simulate the ACS
                SAMLResponseHelper responseHelper1 = new SAMLResponseHelper(null, text, null, null);
                string userName;
                string authority;
                // Simulate the extension
                responseHelper1.GetUserNameAndAuthorityFromResponse(out userName, out authority);
                SAMLResponseHelper responseHelper2 = new SAMLResponseHelper(userName, text, authority, new TenantInfo(new RSACryptoServiceProvider(), null));
                Assert.IsFalse(responseHelper2.IsValid());
            }
        }
    }
}
