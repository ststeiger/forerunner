using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web;
using System.Net.Http.Headers;
using System.Text;
using System.Data.SqlClient;
using System.Net.Mail;
using System.IO;
using System.Threading.Tasks;

namespace Register.Controllers
{
    public class DownloadController : ApiController
    {

        private RegisterUtil Reg = new RegisterUtil();

        private HttpResponseMessage GetResponseFromBytes(byte[] result, string mimeType, bool cache = false, string fileName = null)
        {
            HttpResponseMessage resp = this.Request.CreateResponse();

            if (result != null)
            {
                resp.Content = new ByteArrayContent(result); ;
                resp.Content.Headers.ContentType = new MediaTypeHeaderValue(mimeType);
                if (cache)
                    resp.Headers.Add("Cache-Control", "max-age=86400");
                if (fileName != null)
                    resp.Content.Headers.Add("Content-Disposition", "attachment;filename=" + HttpUtility.UrlEncode(fileName));
            }
            else
                resp.StatusCode = HttpStatusCode.NotFound;

            return resp;
        }
        private HttpResponseMessage ReturnError(Exception e)
        {
            byte[] result = null;
            result = Encoding.UTF8.GetBytes(e.Message);
            return GetResponseFromBytes(result, "text/JSON");
        }

        [HttpGet]
        public HttpResponseMessage Get(string id)
        {
            string errorString = "<DIV><H1>Thank you for your interest in Forerunner Software</H1><BR><BR><H3>We are sorry but we are unable to complete your request either becasue your ID is invalid or you have apttempted to download too many times.</h3><h3>If you need to download the file again please send mail to support@forerunnersw.com</h3>";
            try
            {
                if (Reg.ValidateDownload(id))
                    return GetResponseFromBytes(Reg.GetSetupFile(), "application/exe", false, "ForerunnerMobilizerSetup.exe");
                else
                    return GetResponseFromBytes(Encoding.UTF8.GetBytes(errorString), "text/HTML");
            }
            catch (Exception e)
            {
                return ReturnError(e);
            }

        }

        public void Post()
        {
            string content = this.Request.Content.ReadAsStringAsync().Result;
            Reg.RegisterDownload(content);
        }

        // POST api/values
        //public void Post([FromBody]string value)
        //{
        //}

        // PUT api/values/5
        public void Put(int id, [FromBody]string value)
        {
        }

  
    }
}