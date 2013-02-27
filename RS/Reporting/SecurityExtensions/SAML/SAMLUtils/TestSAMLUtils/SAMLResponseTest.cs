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
            SAMLResponseHelper.SignXmlFile("SampleSAMLResponse.xml", "SignedSAMLResponse.xml", key);
            Trace.TraceInformation("XML file signed.");

            // Verify the signature of the signed XML.
            Trace.TraceInformation("Verifying signature...");
            using (StreamReader streamReader = new StreamReader("SignedSAMLResponse.xml"))
            {
                String text = streamReader.ReadToEnd();
                // Simulate the ACS
                SAMLResponseHelper responseHelper1 = new SAMLResponseHelper(null, text, null, null);
                string nameID;
                string issuer;
                // Simulate the extension
                responseHelper1.GetNameIDAndIssuerFromResponse(out nameID, out issuer);
                string authority = "TestAuthority";
                string userName = SAMLHelperBase.GetUserName(authority, nameID);
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
            SAMLResponseHelper.SignXmlFile("SampleSAMLResponse.xml", "SignedSAMLResponse.xml", key);
            Trace.TraceInformation("XML file signed.");

            // Verify the signature of the signed XML.
            Trace.TraceInformation("Verifying signature...");
            using (StreamReader streamReader = new StreamReader("SignedSAMLResponse.xml"))
            {
                String text = streamReader.ReadToEnd();
                // Simulate the ACS
                SAMLResponseHelper responseHelper1 = new SAMLResponseHelper(null, text, null, null);
                string nameID;
                string issuer;
                // Simulate the extension
                responseHelper1.GetNameIDAndIssuerFromResponse(out nameID, out issuer);
                string authority = "TestAuthority";
                string userName = SAMLHelperBase.GetUserName(authority, nameID);

                Assert.IsTrue(userName.Equals(authority + @"._242f88493449e639aab95dd9b92b1d04234ab84fd8"));
                Assert.IsTrue(issuer.Equals(@"https://openidp.feide.no"));

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
            SAMLResponseHelper.SignXmlFile("SampleSAMLResponse.xml", "SignedSAMLResponse.xml", key);
            Trace.TraceInformation("XML file signed.");

            TamperSignedFile("SignedSAMLResponse.xml");
            // Verify the signature of the signed XML.
            Trace.TraceInformation("Verifying signature...");
            using (StreamReader streamReader = new StreamReader("SignedSAMLResponse.xml"))
            {
                String text = streamReader.ReadToEnd();

                // Simulate the ACS
                SAMLResponseHelper responseHelper1 = new SAMLResponseHelper(null, text, null, null);
                string nameID;
                string issuer;
                // Simulate the extension
                responseHelper1.GetNameIDAndIssuerFromResponse(out nameID, out issuer);
                string authority = "TestAuthority";
                string userName = SAMLHelperBase.GetUserName(authority, nameID);
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
            SAMLResponseHelper.SignXmlFile("SampleSAMLResponse.xml", "SignedSAMLResponse.xml", key);
            Trace.TraceInformation("XML file signed.");

            // Verify the signature of the signed XML.
            Trace.TraceInformation("Verifying signature...");
            using (StreamReader streamReader = new StreamReader("SignedSAMLResponse.xml"))
            {
                String text = streamReader.ReadToEnd();
                // Simulate the ACS
                SAMLResponseHelper responseHelper1 = new SAMLResponseHelper(null, text, null, null);
                string nameID;
                string issuer;
                // Simulate the extension
                responseHelper1.GetNameIDAndIssuerFromResponse(out nameID, out issuer);
                string authority = "TestAuthority";
                string userName = SAMLHelperBase.GetUserName(authority, nameID);
                SAMLResponseHelper responseHelper2 = new SAMLResponseHelper(userName, text, authority, new TenantInfo(new RSACryptoServiceProvider(), null));
                Assert.IsFalse(responseHelper2.IsValid());
            }
        }
    }
}
