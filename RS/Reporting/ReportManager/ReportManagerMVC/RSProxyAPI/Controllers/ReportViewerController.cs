using System;
using System.Collections.Generic;
using System.Configuration;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web;
using System.Net.Http.Headers;
using System.Text;
using Forerunner.ReportViewer;

namespace RSProxyAPI.Controllers
{
    public class ReportViewerController : ApiController
    {
        private string accountName = ConfigurationManager.AppSettings["ForeRunner.TestAccount"];
        private string accountPWD = ConfigurationManager.AppSettings["ForeRunner.TestAccountPWD"];
        private string domainName = ConfigurationManager.AppSettings["ForeRunner.TestAccountDomain"];
        [HttpGet]
        public HttpResponseMessage GetImage(string ReportServerURL, string SessionID, string ImageID)
        {
            ReportViewer rep = new ReportViewer(HttpUtility.UrlDecode(ReportServerURL));
            string mimeType;
            byte[] result;
            HttpResponseMessage resp;

            //Application will need to handel security
            rep.SetCredentials(new Credentials(Credentials.SecurityTypeEnum.Custom, accountName, domainName, accountPWD));

            result = rep.GetImage(SessionID, ImageID, out mimeType);
            ByteArrayContent content = new ByteArrayContent(result);
            resp = this.Request.CreateResponse();
            resp.Content = content;
            resp.Content.Headers.ContentType = new MediaTypeHeaderValue(mimeType);

            return resp;
        }

        [HttpGet]
        public HttpResponseMessage GetThumbnail(string ReportServerURL, string ReportPath, string SessionID, int PageNumber, string PageHeight, string PageWidth)
        {
            ReportViewer rep = new ReportViewer(HttpUtility.UrlDecode(ReportServerURL));
            byte[] result;
            HttpResponseMessage resp;

            //Application will need to handel security
            rep.SetCredentials(new Credentials(Credentials.SecurityTypeEnum.Custom, accountName, domainName, accountPWD));

            result = rep.GetThumbnail(HttpUtility.UrlDecode(ReportPath), SessionID, PageNumber.ToString(), PageHeight, PageWidth);
            ByteArrayContent content = new ByteArrayContent(result);
            resp = this.Request.CreateResponse();
            resp.Content = content;
            resp.Content.Headers.ContentType = new MediaTypeHeaderValue("image/JPEG");

            return resp;
        }

        [HttpGet]
        public HttpResponseMessage GetJSON(string ReportServerURL, string ReportPath, string SessionID, int PageNumber)
        {
            ReportViewer rep = new ReportViewer(HttpUtility.UrlDecode(ReportServerURL));
            byte[] result;
            HttpResponseMessage resp;

            //Application will need to handel security
            rep.SetCredentials(new Credentials(Credentials.SecurityTypeEnum.Custom, accountName, domainName, accountPWD));

            result = Encoding.UTF8.GetBytes(rep.GetReportJson(HttpUtility.UrlDecode(ReportPath), SessionID, PageNumber.ToString()));
            ByteArrayContent content = new ByteArrayContent(result);
            resp = this.Request.CreateResponse();
            resp.Content = content;
            resp.Content.Headers.ContentType = new MediaTypeHeaderValue("text/JSON");

            return resp;
        }
    }
}
