using System;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Xml;
using System.Security;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Security.Cryptography.Xml;
using ForeRunner.Reporting.Extensions.SAMLUtils;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace TestSAMLUtils
{
    [TestClass]
    public class SAMLRequestTest
    {
        [TestMethod]
        [DeploymentItem("myCert.cer")]
        public void TestRequest()
        {
            string certString = File.ReadAllText(".\\myCert.cer");
            X509Certificate2 x509 = new X509Certificate2(Encoding.UTF8.GetBytes(certString));

            TenantInfo tenantInfo = new TenantInfo(x509.PublicKey.Key, new Uri(DatabaseAccessTest.testUrl));
            SAMLRequestHelper requestHelper = new SAMLRequestHelper(tenantInfo, new Uri("http://localhost/acs.ashx"), "TestIssuer");
            string samlRequest = requestHelper.generateSAMLRequest();
            byte[] bytes = Convert.FromBase64String(samlRequest);
            Assert.IsFalse(CheckIsCompressed.IsGZip(bytes));
            requestHelper.IsGZip = true;
            samlRequest = requestHelper.generateSAMLRequest();
            byte[] bytesCompressed = Convert.FromBase64String(samlRequest);
            Assert.IsTrue(CheckIsCompressed.IsGZip(bytesCompressed));

            byte[] bytesUncompressed = SAMLHelperBase.inflateIfNeeded(bytesCompressed);
            Assert.AreEqual(bytes.Length, bytesUncompressed.Length);
            for (int i = 0; i < bytes.Length; i++)
                Assert.AreEqual(bytes[i], bytesUncompressed[i]);
        }

        [TestMethod]
        [DeploymentItem("app.config")]
        public void TestGetAuthorityFromUrl()
        {
            string result = SAMLHelperBase.GetAuthorityFromUrl("http://derp.derp.com/Tenant1/derp/blah");
            Assert.AreEqual("Tenant1", result);
            result = SAMLHelperBase.GetAuthorityFromUrl("http://derp.derp.com/");
            Assert.AreEqual("", result);
        }
    }
}
