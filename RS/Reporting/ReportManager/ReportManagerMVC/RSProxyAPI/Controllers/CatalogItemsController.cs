using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using ForeRunner.RSProxy;

namespace RSProxyAPI.Controllers
{
    public class CatalogItemsController : ApiController
    {
        // TODO:  Replace these with config settings
        private string url = "http://meowlett/ReportServer_WinAuth/ReportService2005.asmx";
        private bool useStub = false;
        // GET api/catalogitem
        public IEnumerable<CatalogItem> Get(bool isRecursive = false)
        {
            RSProxy rs = new RSProxy(url);
            rs.UseStub = useStub;
            return rs.ListChildren("/", isRecursive); 
        }

        // GET api/catalogitem
        public IEnumerable<CatalogItem> Get(string path, bool isRecursive = false)
        {
            RSProxy rs = new RSProxy(url);
            rs.UseStub = useStub;
            return rs.ListChildren(path, isRecursive);
        }
    }
}
