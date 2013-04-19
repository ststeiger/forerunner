using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Routing;
using System.Web.Security;
using Forerunner.ReportControl;
using System.Net.Http.Headers;
using System.Drawing;
using System.IO;
using System.Text;

namespace MvcApplication1.Controllers
{   
    public class ReportController : ApiController
    {
                 
        [HttpGet]
        public HttpResponseMessage GetImage(string ReportServerURL,string SessionID, string ImageID)
        {
            Report rep = new Report(ReportServerURL);
            string mimeType;
            byte[] result;
            HttpResponseMessage resp;

            //Application will need to handel security
            rep.SetCustomSecurity("TestAccount", "Forerunner", "TestPWD");

            result = rep.GetImage(SessionID,ImageID,out mimeType);
            ByteArrayContent content = new ByteArrayContent(result);           
            resp = this.Request.CreateResponse();
            resp.Content = content;
            resp.Content.Headers.ContentType = new MediaTypeHeaderValue(mimeType);

            return resp;
        }

        [HttpGet]
        public HttpResponseMessage GetThumbnail(string ReportServerURL, string ReportPath, string SessionID, int PageNumber, string PageHeight, string PageWidth)
        {
            Report rep = new Report(ReportServerURL);
            byte[] result;
            HttpResponseMessage resp;

            //Application will need to handel security
            rep.SetCustomSecurity("TestAccount", "Forerunner", "TestPWD");

            result = rep.GetThumbnail(ReportPath, SessionID, PageNumber.ToString(),PageHeight,PageWidth);
            ByteArrayContent content = new ByteArrayContent(result);
            resp = this.Request.CreateResponse();
            resp.Content = content;
            resp.Content.Headers.ContentType = new MediaTypeHeaderValue("image/JPEG");

            return resp;
        }

        [HttpGet]
        public HttpResponseMessage GetJSON(string ReportServerURL, string ReportPath, string SessionID, int PageNumber)
        {
            Report rep = new Report(ReportServerURL);
            byte[] result;
            HttpResponseMessage resp;

            //Application will need to handel security
            rep.SetCustomSecurity("TestAccount", "Forerunner", "TestPWD");

            result = Encoding.UTF8.GetBytes(rep.GetReportJson(ReportPath, SessionID, PageNumber.ToString()));
            ByteArrayContent content = new ByteArrayContent(result);
            resp = this.Request.CreateResponse();
            resp.Content = content;
            resp.Content.Headers.ContentType = new MediaTypeHeaderValue("text/JSON");

            return resp;            
        }
    }
}
