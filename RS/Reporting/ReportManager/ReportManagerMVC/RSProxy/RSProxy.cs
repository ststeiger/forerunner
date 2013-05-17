using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Net;

namespace ForeRunner.RSProxy
{

    public class Credentials
    {
        public enum SecurityTypeEnum { Network = 0, Custom = 1 };
        public SecurityTypeEnum SecurityType = SecurityTypeEnum.Network;
        public string UserName;
        public string Domain;
        public string Password;

        public Credentials() { }
        public Credentials(SecurityTypeEnum SecurityType = SecurityTypeEnum.Network, String UserName = "", string Domain = "", string Password = "")
        {
            this.SecurityType = SecurityType;
            this.UserName = UserName;
            this.Password = Password;
            this.Domain = Domain;
        }

    }
    /// <summary>
    /// This is the proxy class that would call RS to get the data
    /// </summary>
    public class RSProxy
    {
        private ReportingService2005 rs = new ReportingService2005();
        
        public bool UseStub { get; set; }
        public RSProxy(string url)
        {
            UseStub = true;
            rs.Url = url;
            rs.Credentials = System.Net.CredentialCache.DefaultCredentials;
        }

        public RSProxy(String url, Credentials Credentials)
        {
            UseStub = true;
            rs.Url = url;
            rs.Credentials = new NetworkCredential(Credentials.UserName, Credentials.Password, Credentials.Domain);
        }

        public void SetCredentials(Credentials Credentials)
        {
            rs.Credentials = new NetworkCredential(Credentials.UserName, Credentials.Password, Credentials.Domain);
        }

        public CatalogItem[] ListChildren(string path, Boolean isRecursive)
        {
            List<CatalogItem> list = new List<CatalogItem>();
            CatalogItem[] items = rs.ListChildren(path, isRecursive);            

            foreach (CatalogItem ci in items)
            {
                if (ci.Type == ItemTypeEnum.Report|| ci.Type == ItemTypeEnum.LinkedReport)
                    list.Add(ci);
                if (ci.Type == ItemTypeEnum.Folder)
                {                    
                    CatalogItem[] folder = rs.ListChildren(ci.Path,false);
                    foreach (CatalogItem fci in folder)
                    {
                        if (fci.Type == ItemTypeEnum.Report || fci.Type == ItemTypeEnum.LinkedReport || fci.Type == ItemTypeEnum.Folder)
                        {
                            list.Add(ci);
                            break;
                        }
                    }
                }
            }
            return list.ToArray();
        }
    }
}
