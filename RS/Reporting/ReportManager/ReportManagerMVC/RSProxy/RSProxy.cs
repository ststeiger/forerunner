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
            if (UseStub)
            {
                List<CatalogItem> list = new List<CatalogItem>();
                if (path == "/" && isRecursive)
                {
                    for (int i = 1; i < 10; i++)
                    {
                        CatalogItem newItem = new CatalogItem();
                        newItem.ID = Guid.NewGuid().ToString();
                        newItem.Name = "Test" + i.ToString();
                        newItem.Path = "/";
                        list.Add(newItem);
                    }
                }
                else
                {
                    for (int i = 1; i < 5; i++)
                    {
                        CatalogItem newItem = new CatalogItem();
                        newItem.ID = Guid.NewGuid().ToString();
                        newItem.Name = "Test" + i.ToString();
                        newItem.Path = path;
                        list.Add(newItem);
                    }
                }
                return list.ToArray();
            }
            
            return rs.ListChildren(path, isRecursive);
        }
    }
}
