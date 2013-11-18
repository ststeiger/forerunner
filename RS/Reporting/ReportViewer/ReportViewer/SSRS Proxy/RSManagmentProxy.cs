using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Net; 

namespace Forerunner.SSRS.Management
{

    public class RSManagementProxy
    {
        private bool IsNative = false;
        private Forerunner.SSRS.Management.Native.ReportingService2005 RSNative = new  Forerunner.SSRS.Management.Native.ReportingService2005();
        private Forerunner.SSRS.Management.SPS.ReportingService2006 RSSPS = new Forerunner.SSRS.Management.SPS.ReportingService2006();

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

        public string[] GetPermissions(string path)
        {
            if (IsNative)
                return RSNative.GetPermissions(path);
            else
                return RSSPS.GetPermissions(path);
        }


        public Property[] GetProperties(string path, Property[] props)
        {
            if (IsNative)
                return RSNative.GetProperties(path, props);
            else
                return RSSPS.GetProperties(path, props);
        }

        public CatalogItem[] ListChildren(string path, Boolean isRecursive)
        {
            if (IsNative)
                return RSNative.ListChildren(path, isRecursive);
            else
                return RSSPS.ListChildren(path);
        }
    }
}
