using System;
using System.Collections.Generic;
using System.Text;
using ForeRunner.Reporting.Extensions.SAML;

namespace SAMLExtensionTest
{
    public class MockReportServerProxyFactory : IReportServerFactory
    {
        public IReportServer getInstance()
        {
            return new MockReportServerProxy();
        }
    }
}
