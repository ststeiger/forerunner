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
using System.IO;

namespace ReportViewerTest.Controllers
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
            HttpResponseMessage resp = this.Request.CreateResponse(); 

            //Application will need to handel security
            rep.SetCredentials(new Credentials(Credentials.SecurityTypeEnum.Custom, accountName, domainName, accountPWD));

            result = rep.GetImage(SessionID, ImageID, out mimeType);            
            if (result != null)
            {                
                resp.Content = new ByteArrayContent(result); ;
                resp.Content.Headers.ContentType = new MediaTypeHeaderValue(mimeType);
            }
            else
                resp.StatusCode = HttpStatusCode.NotFound;

            return resp;
        }

        [HttpGet]
        public HttpResponseMessage GetThumbnail(string ReportServerURL, string ReportPath, string SessionID, int PageNumber)
        {

            ReportViewer rep = new ReportViewer(HttpUtility.UrlDecode(ReportServerURL));
            byte[] result;
            HttpResponseMessage resp = this.Request.CreateResponse();;

            //Application will need to handel security
            rep.SetCredentials(new Credentials(Credentials.SecurityTypeEnum.Custom, accountName, domainName, accountPWD));
            result = rep.GetThumbnail(HttpUtility.UrlDecode(ReportPath), SessionID, PageNumber.ToString());

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
        public HttpResponseMessage GetJSON(string ReportServerURL, string ReportPath, string SessionID, int PageNumber, string ParameterList)
        {
            ReportViewer rep = new ReportViewer(HttpUtility.UrlDecode(ReportServerURL));
            byte[] result;
            HttpResponseMessage resp = this.Request.CreateResponse(); 

            //Application will need to handel security
            rep.SetCredentials(new Credentials(Credentials.SecurityTypeEnum.Custom, accountName, domainName, accountPWD));

            result = Encoding.UTF8.GetBytes(rep.GetReportJson(HttpUtility.UrlDecode(ReportPath), SessionID, PageNumber.ToString(), ParameterList));            
            resp.Content = new ByteArrayContent(result); ;
            resp.Content.Headers.ContentType = new MediaTypeHeaderValue("text/JSON");

            return resp;
        }

        [HttpGet]
        public HttpResponseMessage PingSession(string ReportServerURL, string ReportPath, string SessionID)
        {
            ReportViewer rep = new ReportViewer(HttpUtility.UrlDecode(ReportServerURL));
            HttpResponseMessage resp = this.Request.CreateResponse();

            //Application will need to handel security
            rep.SetCredentials(new Credentials(Credentials.SecurityTypeEnum.Custom, accountName, domainName, accountPWD));

            rep.pingSession(ReportPath,SessionID);            
            resp.StatusCode = HttpStatusCode.OK;
            return resp;

        }
    }
}
