using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Net.Http.Headers;
using Forerunner.Manager;
using Forerunner;

namespace ReportManager.Controllers
{
    public class ReportManagerController : ApiController
    {
        private string url = ConfigurationManager.AppSettings["Forerunner.ReportServerWSUrl"];
        private string accountName = ConfigurationManager.AppSettings["Forerunner.TestAccount"];
        private string accountPWD = ConfigurationManager.AppSettings["Forerunner.TestAccountPWD"];
        private string domainName = ConfigurationManager.AppSettings["Forerunner.TestAccountDomain"];

        private string ReportServerDataSource = ConfigurationManager.AppSettings["Forerunner.ReportServerDataSource"];
        private string ReportServerDB = ConfigurationManager.AppSettings["Forerunner.ReportServerDB"];
        private string ReportServerDBUser = ConfigurationManager.AppSettings["Forerunner.ReportServerDBUser"];
        private string ReportServerDBPWD = ConfigurationManager.AppSettings["Forerunner.ReportServerDBPWD"];
        private string ReportServerSSL = ConfigurationManager.AppSettings["Forerunner.ReportServerSSL"];

        // GET api/ReportMananger/GetItems
        [HttpGet]
        public IEnumerable<CatalogItem> GetItems(bool isRecursive = false)
        {
            Credentials WSCred = new Credentials(Credentials.SecurityTypeEnum.Custom, accountName, domainName, accountPWD);
            Credentials DBCred = new Credentials(Credentials.SecurityTypeEnum.Custom, ReportServerDBUser, "", ReportServerDBPWD);
            Forerunner.Manager.ReportManager rs = new Forerunner.Manager.ReportManager(url, WSCred, ReportServerDataSource, ReportServerDB,DBCred);
            return rs.ListChildren("/", isRecursive); 
        }

        // GET api/ReportMananger/GetItems
        [HttpGet]
        public IEnumerable<CatalogItem> GetItems(string path, bool isRecursive = false)
        {
            Credentials WSCred = new Credentials(Credentials.SecurityTypeEnum.Custom, accountName, domainName, accountPWD);
            Credentials DBCred = new Credentials(Credentials.SecurityTypeEnum.Custom, ReportServerDBUser, "", ReportServerDBPWD);
            Forerunner.Manager.ReportManager rs = new Forerunner.Manager.ReportManager(url, WSCred, ReportServerDataSource, ReportServerDB, DBCred); 
            return rs.ListChildren(path, isRecursive);
        }

        [HttpGet]
        public HttpResponseMessage GetThumbnail(string ReportPath)
        {

            Credentials WSCred = new Credentials(Credentials.SecurityTypeEnum.Custom, accountName, domainName, accountPWD);
            Credentials DBCred = new Credentials(Credentials.SecurityTypeEnum.Custom, ReportServerDBUser, "", ReportServerDBPWD);
            Forerunner.Manager.ReportManager rs = new Forerunner.Manager.ReportManager(url, WSCred, ReportServerDataSource, ReportServerDB, DBCred);

            byte[] result = rs.GetCatalogImage(ReportPath);
            HttpResponseMessage resp = this.Request.CreateResponse(); ;

            if (result != null)
            {
                resp.Content = new ByteArrayContent(result); ;
                resp.Content.Headers.ContentType = new MediaTypeHeaderValue("image/JPEG");
            }
            else
                resp.StatusCode = HttpStatusCode.NotFound;

            return resp;
        }

    }
}
