using System;
using System.IO;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Web;
using System.Web.Configuration;
using System.Web.Hosting;
using Common.Web;
using ForeRunner.Reporting.Extensions.SAML;
using ForeRunner.Reporting.Extensions.SAMLUtils;
using Microsoft.VisualStudio.TestTools.UnitTesting;

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

        private string GetSAMLReponse()
        {
            byte[] privateKey = File.ReadAllBytes(".\\myCert.p12");
            X509Certificate2 x509 = new X509Certificate2(privateKey, "password");
            SAMLResponseHelper.SignXmlFile(".\\SAMLResponse.xml", ".\\SignedSAMLResponse.xml", x509.PrivateKey);

            return SAMLRequestHelper.zipAndEncode(System.Text.Encoding.UTF8.GetBytes(File.ReadAllText(".\\SignedSAMLResponse.xml")));
        }

        [TestMethod]
        [DeploymentItem("SAMLResponse.xml")]
        [DeploymentItem("app.config")]
        [DeploymentItem("myCert.p12")]
        [DeploymentItem("myCert.cer")]
        public void TestACSHappyCase()
        {
            string certString = File.ReadAllText(".\\myCert.cer");
            DatabaseHelper.loadCertificate("Tenant1", certString);
            string samlResponse = GetSAMLReponse();
            byte[] samlData = Convert.FromBase64String(samlResponse);
            string queryString = "RelayState=" + HtmlUtility.UrlEncode(Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("http://whatever.com/Tenant1/"))) + "&SAMLResponse=" + HtmlUtility.UrlEncode(samlResponse);
            string result = RawRequest("ACS.ashx", queryString);
        }
    }
}
