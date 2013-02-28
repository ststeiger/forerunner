using System;
using System.Collections.Generic;
using System.Text;

namespace ForeRunner.Reporting.Extensions.SAML
{
    public interface IReportServerFactory
    {
        IReportServer getInstance();
    }
}
