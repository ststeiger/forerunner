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
using System.IO;

namespace RegisterWebService.Controllers
{
    public class DownloadController : ApiController
    {

        private Register Reg = new Register();
        static private byte[] logo = null;
        
        [HttpGet]
        public HttpResponseMessage Get(string Referer, string Page)
        {
            string cookievalue;
            HttpResponseMessage Response = this.Request.CreateResponse();
            this.Request.CreateResponse();

            if (HttpContext.Current.Request.Cookies["ForerunnerID"] != null)
            {
                cookievalue = HttpContext.Current.Request.Cookies["ForerunnerID"].Value;
            }
            else
            {
                cookievalue = Guid.NewGuid().ToString();
                CookieHeaderValue[] c = new CookieHeaderValue[1];
                c[0] = new CookieHeaderValue("ForerunnerID", cookievalue) ;
                c[0].Expires = DateTime.Now.AddYears(1);

                Response.Headers.AddCookies(c);
                
            }

            Reg.SavePageView(cookievalue, Page, Referer, WebSerivceHelper.GetUserIP());

            Response.StatusCode = HttpStatusCode.OK;            
            return Response;
        }

        public HttpResponseMessage Post()
        {
            string content = this.Request.Content.ReadAsStringAsync().Result;
            Reg.RegisterDownload(content);

            return WebSerivceHelper.Redirect("https://forerunnersw.com/home/thankyou",this.Request.CreateResponse());

        }

        [HttpGet]
        public HttpResponseMessage Image(string ID,string user)
        {
            Reg.SaveEmailOpen(ID,user);

            if (logo == null)
            {
                logo = File.ReadAllBytes(System.Web.HttpContext.Current.Server.MapPath("~") + "/content/img/logo.png");
            }

            return WebSerivceHelper.GetResponseFromBytes(logo, "image/png", new HttpResponseMessage(HttpStatusCode.OK));
        }
  
    }
}
