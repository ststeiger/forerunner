using System;
using System.Collections.Generic;
using System.Text;

namespace ForeRunner.Reporting.Extensions.SAML
{
    class ReportServerProxyFactory : IReportServerFactory
    {
        public IReportServer getInstance()
        {
            return new ReportServerProxy();
        }
    }
}
