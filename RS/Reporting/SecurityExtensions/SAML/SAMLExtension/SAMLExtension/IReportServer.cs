using System;
using System.Collections.Generic;
using System.Text;

namespace ForeRunner.Reporting.Extensions.SAML
{
    /// <summary>
    /// This is added because I need to be able to mock out the ReportServerProxy for unit testing
    /// </summary>
    public interface IReportServer
    {
        void LogonUser(string userName, string password, string authority);
        string Url
        {
            get;
            set;
        }
    }
}
