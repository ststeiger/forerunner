using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using ForeRunner.RSProxy;

namespace ReportManager.Controllers
{
    public class CatalogItemsController : ApiController
    {
        private string url = ConfigurationManager.AppSettings["ForeRunner.ReportServerWSUrl"];
        private string accountName = ConfigurationManager.AppSettings["ForeRunner.TestAccount"];
        private string accountPWD = ConfigurationManager.AppSettings["ForeRunner.TestAccountPWD"];
        private string domainName = ConfigurationManager.AppSettings["ForeRunner.TestAccountDomain"];
        
        private bool useStub = false;
        // GET api/catalogitem
        public IEnumerable<CatalogItem> Get(bool isRecursive = false)
        {
            RSProxy rs = new RSProxy(url, new Credentials(Credentials.SecurityTypeEnum.Network, accountName, domainName, accountPWD));
            rs.UseStub = useStub;
            return rs.ListChildren("/", isRecursive); 
        }

        // GET api/catalogitem
        public IEnumerable<CatalogItem> Get(string path, bool isRecursive = false)
        {
            RSProxy rs = new RSProxy(url, new Credentials(Credentials.SecurityTypeEnum.Network, accountName, domainName, accountPWD));
            rs.UseStub = useStub;
            return rs.ListChildren(path, isRecursive);
        }
    }
}
