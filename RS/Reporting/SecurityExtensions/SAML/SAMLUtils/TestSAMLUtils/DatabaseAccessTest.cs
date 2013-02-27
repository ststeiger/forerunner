using System;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Globalization;
using System.IO;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using ForeRunner.Reporting.Extensions.SAMLUtils;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace TestSAMLUtils
{
    [TestClass]
    public class DatabaseAccessTest
    {
        public static string testUrl = "http://localhost/blah";
        public static string testAuthority = "Tenant1";

        [TestMethod]
        [DeploymentItem("app.config")]
        [DeploymentItem("myCert.cer")]
        public void TestCertficateSPs()
        {
            string certString = File.ReadAllText(".\\myCert.cer");
            DatabaseHelper.loadCertificate(testAuthority, certString);
            X509Certificate2 expectedx509 = new X509Certificate2(Encoding.UTF8.GetBytes(certString));

            X509Certificate2 x509 = SAMLHelperBase.GetCertificateFromDB(testAuthority);
            Assert.AreEqual(expectedx509.Thumbprint, x509.Thumbprint);
        }

        [TestMethod]
        [DeploymentItem("app.config")]
        public void TestIDPUrl()
        {
            DatabaseHelper.loadIDPUrl(testAuthority, testUrl);

            string result = SAMLHelperBase.GetIDPUrl(testAuthority);
            Assert.AreEqual(testUrl, result);
        }

        [TestMethod]
        [DeploymentItem("app.config")]
        public void TestAddReportingUser()
        {
            DatabaseHelper.addReportingUser(testAuthority, "blah@gmail.com");

            Assert.IsTrue(SAMLHelperBase.VerifyUserAndAuthority("Tenant1.blah@gmail.com", testAuthority));
        }
    }
}
