using System;
using System.IO;
using System.Security.Cryptography;
using System.Security.Cryptography.Xml;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Web;
using System.Web.Configuration;
using System.Web.Hosting;
using System.Xml;
using Common.Web;
using ForeRunner.Reporting.Extensions.SAML;
using ForeRunner.Reporting.Extensions.SAMLUtils;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using ComponentSpace.SAML2.Protocols;

namespace SAMLExtensionTest
{
    [TestClass]
    public class ACSTest
    {
        protected string RawRequest(string fileName, string queryString)
        {
            StringBuilder output = new StringBuilder();
            using (StringWriter sw = new StringWriter(output))
            {
                HttpResponse response = new HttpResponse(sw);
                HttpRequest request = new HttpRequest(fileName, "http://whatever.com/" + fileName, queryString);
                HttpContext context = new HttpContext(request, response);
                HttpContext.Current = context;
                new ACSTestSubClass().ProcessRequest(context);
            }
            return output.ToString();
        }

        private string GetSAMLReponse(string xamlResponseFile, bool encode = true, string certFile = ".\\myCert.p12")
        {
            byte[] privateKey = File.ReadAllBytes(certFile);
            X509Certificate2 x509 = new X509Certificate2(privateKey, "password");
            SAMLResponseHelper.SignXmlFile(xamlResponseFile, ".\\SignedSAMLResponse.xml", x509.PrivateKey);

            if (encode)
            {
                return SAMLRequestHelper.zipAndEncode(System.Text.Encoding.UTF8.GetBytes(File.ReadAllText(".\\SignedSAMLResponse.xml")));
            }
            else
            {
                return File.ReadAllText(".\\SignedSAMLResponse.xml");
            }
        }

        [TestMethod]
        [DeploymentItem("SAMLResponse.xml")]
        [DeploymentItem("app.config")]
        [DeploymentItem("myCert.cer")]
        [DeploymentItem("myCert.p12")]
        public void TestACSHappyCase()
        {
            string certString = File.ReadAllText(".\\myCert.cer");
            DatabaseHelper.loadCertificate("Tenant1", certString);
            string samlResponse = GetSAMLReponse(".\\SAMLResponse.xml");
            byte[] samlData = Convert.FromBase64String(samlResponse);
            string queryString = "RelayState=" + HtmlUtility.UrlEncode(Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("http://whatever.com/Tenant1/"))) + "&SAMLResponse=" + HtmlUtility.UrlEncode(samlResponse);
            string result = RawRequest("ACS.ashx", queryString);
        }

        [TestMethod]
        [DeploymentItem("RealSAMLResponse.xml")]
        [DeploymentItem("app.config")]
        [DeploymentItem("server.pem")]
        public void TestExtension()
        {
            X509Certificate2 cert = SAMLHelperBase.GetCertificateFromDB("");
            string samlResponse = File.ReadAllText(".\\RealSAMLResponse.xml");
            XmlDocument doc = new XmlDocument();
            doc.LoadXml(samlResponse);
            //Assert.IsTrue(SAMLMessageSignature.IsSigned(doc.DocumentElement));
            //Assert.IsTrue(SAMLMessageSignature.Verify(doc.DocumentElement));
            SAMLAuthenticationExtension ext = new SAMLAuthenticationExtension();
            Assert.IsTrue(ext.LogonUser(".employee@gmail.com", samlResponse, ""));
        }

        [TestMethod]
        [DeploymentItem("RealSAMLResponse.xml")]
        [DeploymentItem("app.config")]
        [DeploymentItem("server.crt")]
        public void TestSignature()
        {
            X509Certificate2 cert = SAMLHelperBase.GetCertificateFromDB("");
            //string certString = File.ReadAllText(".\\server.crt");
            cert = new X509Certificate2(".\\server.crt");
            string samlResponse = File.ReadAllText(".\\RealSAMLResponse.xml");
            XmlDocument doc = new XmlDocument();
            doc.PreserveWhitespace = false;
            doc.LoadXml(samlResponse);

            MySignedXml signedXml = new MySignedXml(doc.DocumentElement);

            XmlElement node = (XmlElement)doc.SelectSingleNode(@"//*[local-name(.) = 'Signature' and namespace-uri(.) = 'http://www.w3.org/2000/09/xmldsig#']");

            if (node != null)
            {
                // Load the signature node.
                signedXml.LoadXml(node);
                Assert.IsTrue(signedXml.CheckSignature(cert.PublicKey.Key));
            }
            //CheckSignedInfo(cert.PublicKey.Key);
            //Assert.IsTrue(SAMLMessageSignature.IsSigned(doc.DocumentElement));
            //Assert.IsTrue(SAMLMessageSignature.Verify(doc.DocumentElement));
            //SAMLAuthenticationExtension ext = new SAMLAuthenticationExtension();
            //Assert.IsTrue(ext.LogonUser(".employee@gmail.com", samlResponse, ""));
        }

        [TestMethod]
        [DeploymentItem("UnsignedSAMLResponse.xml")]
        [DeploymentItem("app.config")]
        [DeploymentItem("server.crt")]
        [DeploymentItem("server.p12")]
        public void TestSignature2()
        {
            string samlResponse = GetSAMLReponse(".\\UnsignedSAMLResponse.xml", false, ".\\server.p12");
            X509Certificate2 cert = new X509Certificate2(".\\server.crt");
            XmlDocument doc = new XmlDocument();
            doc.PreserveWhitespace = true;
            doc.LoadXml(samlResponse);

            SignedXml signedXml = new SignedXml(doc.DocumentElement);

            XmlElement node = (XmlElement)doc.SelectSingleNode(@"//*[local-name(.) = 'Signature' and namespace-uri(.) = 'http://www.w3.org/2000/09/xmldsig#']");

            if (node != null)
            {
                // Load the signature node.
                signedXml.LoadXml(node);
                Assert.IsTrue(signedXml.CheckSignature(cert.PublicKey.Key));
            }

            SAMLResponseHelper helper = new SAMLResponseHelper(".employee@gmail.com", samlResponse, "", new TenantInfo(cert.PublicKey.Key, null));
            Assert.IsTrue(helper.IsValid());
        }

        [TestMethod]
        [DeploymentItem("UnsignedSAMLResponse.xml")]
        [DeploymentItem("app.config")]
        [DeploymentItem("myCert.cer")]
        [DeploymentItem("myCert.p12")]
        public void TestSignature3()
        {
            string samlResponse = GetSAMLReponse(".\\UnsignedSAMLResponse.xml", false, ".\\myCert.p12");
            X509Certificate2 cert = new X509Certificate2(".\\myCert.cer");
            XmlDocument doc = new XmlDocument();
            doc.PreserveWhitespace = true;
            doc.LoadXml(samlResponse);

            SignedXml signedXml = new SignedXml(doc.DocumentElement);

            XmlElement node = (XmlElement)doc.SelectSingleNode(@"//*[local-name(.) = 'Signature' and namespace-uri(.) = 'http://www.w3.org/2000/09/xmldsig#']");

            if (node != null)
            {
                // Load the signature node.
                signedXml.LoadXml(node);
                Assert.IsTrue(signedXml.CheckSignature(cert.PublicKey.Key));
            }

            SAMLResponseHelper helper = new SAMLResponseHelper(".employee@gmail.com", samlResponse, "", new TenantInfo(cert.PublicKey.Key, null));
            Assert.IsTrue(helper.IsValid());
        }

        [TestMethod]
        [DeploymentItem("UnsignedSAMLResponse.xml")]
        [DeploymentItem("app.config")]
        public void TestSignature4()
        {
            RSACryptoServiceProvider key = new RSACryptoServiceProvider();
            SAMLResponseHelper.SignXmlFile(".\\UnsignedSAMLResponse.xml", ".\\SignedSAMLResponse.xml", key);
            XmlDocument doc = new XmlDocument();
            doc.PreserveWhitespace = true;
            doc.Load(".\\SignedSAMLResponse.xml");

            SignedXml signedXml = new SignedXml(doc.DocumentElement);

            XmlElement node = (XmlElement)doc.SelectSingleNode(@"//*[local-name(.) = 'Signature' and namespace-uri(.) = 'http://www.w3.org/2000/09/xmldsig#']");

            if (node != null)
            {
                // Load the signature node.
                signedXml.LoadXml(node);
                Assert.IsTrue(signedXml.CheckSignature(key));
            }

            SAMLResponseHelper helper = new SAMLResponseHelper(".employee@gmail.com", File.ReadAllText(".\\SignedSAMLResponse.xml"), "", new TenantInfo(key, null));
            Assert.IsTrue(helper.IsValid());
        }
    }
}
