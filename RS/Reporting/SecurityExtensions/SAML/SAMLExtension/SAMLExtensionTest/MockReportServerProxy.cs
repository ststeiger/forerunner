using System;
using System.Collections.Generic;
using System.Text;
using ForeRunner.Reporting.Extensions.SAML;

namespace SAMLExtensionTest
{
    public class MockReportServerProxy : IReportServer
    {
        private string url;
        public void LogonUser(string userName, string password, string authority)
        {
        }

        public string Url
        {
            get { return url; }
            set { url = value; }
        }
    }
}
