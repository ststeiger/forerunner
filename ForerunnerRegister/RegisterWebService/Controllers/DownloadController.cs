using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Net.Http.Headers;
using System.Web;
using System.Text;
using ForerunnerRegister;
using ForerunnerWebService;

namespace RegisterWebService.Controllers
{
    public class DownloadController : ApiController
    {

        private Register Reg = new Register();
        
        [HttpGet]
        public HttpResponseMessage Get(string id)
        {
            string errorString = "<DIV><H1>Thank you for your interest in Forerunner Software</H1><BR><BR><H3>We are sorry but we are unable to complete your request either becasue your ID is invalid or you have apttempted to download too many times.</h3><h3>If you need to download the file again please send mail to support@forerunnersw.com</h3>";
            try
            {
                if (Reg.ValidateDownload(id))
                    return WebSerivceHelper.GetResponseFromBytes(Reg.GetSetupFile(), "application/exe", this.Request.CreateResponse(), false, "ForerunnerMobilizerSetup.exe");
                else
                    return WebSerivceHelper.GetResponseFromBytes(Encoding.UTF8.GetBytes(errorString), "text/HTML", this.Request.CreateResponse());
            }
            catch (Exception e)
            {
                return WebSerivceHelper.ReturnError(e, this.Request.CreateResponse());
            }

        }

        public HttpResponseMessage Post()
        {
            string content = this.Request.Content.ReadAsStringAsync().Result;
            Reg.RegisterDownload(content);
#if DEBUG
            Reg.DoWork();
#endif
            return WebSerivceHelper.Redirect("http://forerunnersw.com/thankyou.html",this.Request.CreateResponse());

        }

  
    }
}
