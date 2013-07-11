using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Net.Http.Headers;
using System.Text;
using Forerunner.SSRS.Management;
using Forerunner.SSRS.Manager;
using Forerunner;

namespace ReportManager.Controllers
{
    public class ReportManagerController : ApiController
    {
        private string url = ConfigurationManager.AppSettings["Forerunner.ReportServerWSUrl"];
        private string accountName = ConfigurationManager.AppSettings["Forerunner.TestAccount"];
        private string accountPWD = ConfigurationManager.AppSettings["Forerunner.TestAccountPWD"];
        private string domainName = ConfigurationManager.AppSettings["Forerunner.TestAccountDomain"];

        private bool useIntegratedSecurity = String.Equals("true", ConfigurationManager.AppSettings["Forerunner.UseIntegratedSecurityForSQL"]);
        private string ReportServerDataSource = ConfigurationManager.AppSettings["Forerunner.ReportServerDataSource"];
        private string ReportServerDB = ConfigurationManager.AppSettings["Forerunner.ReportServerDB"];
        private string ReportServerDBUser = ConfigurationManager.AppSettings["Forerunner.ReportServerDBUser"];
        private string ReportServerDBPWD = ConfigurationManager.AppSettings["Forerunner.ReportServerDBPWD"];
        private string ReportServerDBDomain = ConfigurationManager.AppSettings["Forerunner.ReportServerDBDomain"];
        private string ReportServerSSL = ConfigurationManager.AppSettings["Forerunner.ReportServerSSL"];

        private Forerunner.SSRS.Manager.ReportManager GetReportManager()
        {
            //Put application security here
            Credentials WSCred = new Credentials(Credentials.SecurityTypeEnum.Custom, accountName, domainName, accountPWD);
            Credentials DBCred = new Credentials(Credentials.SecurityTypeEnum.Custom, ReportServerDBUser, ReportServerDBDomain == null ? "" : ReportServerDBDomain, ReportServerDBPWD);
            return new Forerunner.SSRS.Manager.ReportManager(url, WSCred, ReportServerDataSource, ReportServerDB, DBCred, useIntegratedSecurity);
        }
        private HttpResponseMessage GetResponseFromBytes(byte[] result, string mimeType,bool cache = false)
        {
            HttpResponseMessage resp = this.Request.CreateResponse();

            if (result != null)
            {
                resp.Content = new ByteArrayContent(result); ;
                resp.Content.Headers.ContentType = new MediaTypeHeaderValue(mimeType);
                if (cache)
                    resp.Headers.Add("Cache-Control", "max-age=7887000");  //3 months
            }
            else
                resp.StatusCode = HttpStatusCode.NotFound;

            return resp;
        }
        // GET api/ReportMananger/GetItems
        [HttpGet]
        public IEnumerable<CatalogItem> GetItems(string view, string path)
        {
            return GetReportManager().GetItems(view, path);
        }


        [HttpGet]
        public HttpResponseMessage GetThumbnail(string ReportPath,string DefDate)
        {
            return GetResponseFromBytes(GetReportManager().GetCatalogImage(ReportPath), "image/JPEG",true);            
        }

        [HttpGet]
        public HttpResponseMessage UpdateView(string view, string action, string path)
        {
            return GetResponseFromBytes(GetReportManager().UpdateView(view,action,path), "text/JSON");
        }

        [HttpGet]
        public HttpResponseMessage isFavorite(string path)
        {
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager().IsFavorite(path)), "text/JSON");
        }


    }
}
