using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Net;

namespace PublishExtension.Management
{

    public class RSManagementProxy
    {
        private bool IsNative = false;
        private PublishExtension.ReportService2005.ReportingService2005 RSNative = new PublishExtension.ReportService2005.ReportingService2005();
        private PublishExtension.ReportService2006.ReportingService2006 RSSPS = new PublishExtension.ReportService2006.ReportingService2006();

        public RSManagementProxy(bool IsNative)
        {
            this.IsNative = IsNative;
        }

        public string Url
        {
            get
            {
                
                if (IsNative)
                    return RSNative.Url;
                else
                    return RSSPS.Url;    
            }
            set
            {
                if (IsNative)
                    RSNative.Url = value + "/ReportService2005.asmx";
                else
                    RSSPS.Url = value + "/ReportService2006.asmx";                
            }
        }

        public ICredentials Credentials
        {
            get
            {

                if (IsNative)
                    return RSNative.Credentials;
                else
                    return RSSPS.Credentials;
            }
            set
            {
                if (IsNative)
                    RSNative.Credentials = value;
                else
                    RSSPS.Credentials = value;
            }
        }

        public void Dispose()
        {
            if (IsNative)
                RSNative.Dispose();
            else
                RSSPS.Dispose();
        }

        public Property[] GetProperties(string path, Property[] props)
        {
            if (IsNative)
                return RSNative.GetProperties(path, props);
            else
                return RSSPS.GetProperties(path, props);
        }

        public void SetProperties(string path, Property[] props)
        {
            if (IsNative)
                RSNative.SetProperties(path, props);
            else
                RSSPS.SetProperties(path, props);
        }

    }  // class RSManagementProxy
}  // namespace PublishExtension.Management
