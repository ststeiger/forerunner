using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Net.Http.Headers;
using System.Text;
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

        private bool useIntegratedSecurity = String.Equals("true", ConfigurationManager.AppSettings["Forerunner.UseIntegratedSecurityForSQL"]);
        private string ReportServerDataSource = ConfigurationManager.AppSettings["Forerunner.ReportServerDataSource"];
        private string ReportServerDB = ConfigurationManager.AppSettings["Forerunner.ReportServerDB"];
        private string ReportServerDBUser = ConfigurationManager.AppSettings["Forerunner.ReportServerDBUser"];
        private string ReportServerDBPWD = ConfigurationManager.AppSettings["Forerunner.ReportServerDBPWD"];
        private string ReportServerDBDomain = ConfigurationManager.AppSettings["Forerunner.ReportServerDBDomain"];
        private string ReportServerSSL = ConfigurationManager.AppSettings["Forerunner.ReportServerSSL"];

       
        // GET api/ReportMananger/GetItems
        [HttpGet]
        public IEnumerable<CatalogItem> GetItems(string view, string path )
        {
            Credentials WSCred = new Credentials(Credentials.SecurityTypeEnum.Custom, accountName, domainName, accountPWD);
            Credentials DBCred = new Credentials(Credentials.SecurityTypeEnum.Custom, ReportServerDBUser, ReportServerDBDomain == null ? "" : ReportServerDBDomain, ReportServerDBPWD);
            Forerunner.Manager.ReportManager rs = new Forerunner.Manager.ReportManager(url, WSCred, ReportServerDataSource, ReportServerDB, DBCred, useIntegratedSecurity);
            if (view == "favorites")
                return rs.GetFavorites();
            else if (view == "recent")
                return rs.GetRecentReports();
            else if (view == "catalog")
                return rs.ListChildren(path, false);
            else
                return null;
        }


        [HttpGet]
        public HttpResponseMessage GetThumbnail(string ReportPath)
        {

            Credentials WSCred = new Credentials(Credentials.SecurityTypeEnum.Custom, accountName, domainName, accountPWD);
            Credentials DBCred = new Credentials(Credentials.SecurityTypeEnum.Custom, ReportServerDBUser, ReportServerDBDomain == null ? "" : ReportServerDBDomain, ReportServerDBPWD);
            Forerunner.Manager.ReportManager rs = new Forerunner.Manager.ReportManager(url, WSCred, ReportServerDataSource, ReportServerDB, DBCred, useIntegratedSecurity);

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

        [HttpGet]
        public HttpResponseMessage UpdateView(string view, string action, string path)
        {
            byte[] result = null;
            HttpResponseMessage resp = this.Request.CreateResponse();
            Credentials WSCred = new Credentials(Credentials.SecurityTypeEnum.Custom, accountName, domainName, accountPWD);
            Credentials DBCred = new Credentials(Credentials.SecurityTypeEnum.Custom, ReportServerDBUser, ReportServerDBDomain == null ? "" : ReportServerDBDomain, ReportServerDBPWD);
            Forerunner.Manager.ReportManager rs = new Forerunner.Manager.ReportManager(url, WSCred, ReportServerDataSource, ReportServerDB, DBCred, useIntegratedSecurity);

            if (view == "favorites")
            {
                if (action == "delete")
                    result = Encoding.UTF8.GetBytes(rs.DeleteFavorite(path));
                else if (action == "add")
                    result = Encoding.UTF8.GetBytes(rs.SaveFavorite(path));                
            }

            if (result != null)
            {
                resp.Content = new ByteArrayContent(result);
                resp.Content.Headers.ContentType = new MediaTypeHeaderValue("image/JPEG");
            }
            else
                resp.StatusCode = HttpStatusCode.NotFound;
            

            return resp;
        }

        [HttpGet]
        public HttpResponseMessage isFavorite(string path)
        {
            byte[] result = null;
            HttpResponseMessage resp = this.Request.CreateResponse();
            Credentials WSCred = new Credentials(Credentials.SecurityTypeEnum.Custom, accountName, domainName, accountPWD);
            Credentials DBCred = new Credentials(Credentials.SecurityTypeEnum.Custom, ReportServerDBUser, ReportServerDBDomain == null ? "" : ReportServerDBDomain, ReportServerDBPWD);
            Forerunner.Manager.ReportManager rs = new Forerunner.Manager.ReportManager(url, WSCred, ReportServerDataSource, ReportServerDB, DBCred, useIntegratedSecurity);

            result = Encoding.UTF8.GetBytes(rs.IsFavorite(path));
    
            if (result != null)
            {
                resp.Content = new ByteArrayContent(result);
                resp.Content.Headers.ContentType = new MediaTypeHeaderValue("image/JPEG");
            }
            else
                resp.StatusCode = HttpStatusCode.NotFound;


            return resp;
        }


    }
}
