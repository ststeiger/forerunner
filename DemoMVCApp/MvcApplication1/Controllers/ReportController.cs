using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Routing;
using System.Web.Security;
using ReportControl;
using System.Net.Http.Headers;
using System.Drawing;
using System.IO;
using System.Text;

namespace MvcApplication1.Controllers
{   
    public class ReportController : ApiController
    {
         
        [HttpGet]
        public HttpResponseMessage GetImage(string RepServer,string SessionID, string ImageID)
        {
            Report Rep = new Report(RepServer);
            string mimeType;
            byte[] result;
            HttpResponseMessage Resp;

            result = Rep.GetImage(SessionID,ImageID,out mimeType);
            ByteArrayContent content = new ByteArrayContent(result);           
            Resp = this.Request.CreateResponse();
            Resp.Content = content;
            Resp.Content.Headers.ContentType = new MediaTypeHeaderValue(mimeType);

            return Resp;
        }

        [HttpGet]
        public HttpResponseMessage GetJSON(string RepServer, string ReportPath, string SessionID, int PageID)
        {
            Report Rep = new Report(RepServer);
            byte[] result;
            HttpResponseMessage Resp;

            result = Encoding.UTF8.GetBytes(Rep.GetReportJson(ReportPath,SessionID,PageID.ToString()));
            ByteArrayContent content = new ByteArrayContent(result);
            Resp = this.Request.CreateResponse();
            Resp.Content = content;
            Resp.Content.Headers.ContentType = new MediaTypeHeaderValue("text/JSON");

            return Resp;            
        }
    }
}
