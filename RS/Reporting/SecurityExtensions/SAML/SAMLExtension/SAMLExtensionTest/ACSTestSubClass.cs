using System;
using System.Collections.Generic;
using System.Text;
using ForeRunner.Reporting.Extensions.SAML;

namespace SAMLExtensionTest
{
    public class ACSTestSubClass : AssertionConsumerService
    {
        public ACSTestSubClass()
        {
            this.reportServerFactory = new MockReportServerProxyFactory();
        }
    }
}
