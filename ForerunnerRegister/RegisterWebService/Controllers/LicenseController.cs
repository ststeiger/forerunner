using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using ForerunnerRegister;
using ForerunnerWebService;
using ForerunnerLicense;

namespace RegisterWebService.Controllers
{
    public class LicenseController : ApiController
    {


        // POST api/license
        public HttpResponseMessage Post()
        {
            string content = this.Request.Content.ReadAsStringAsync().Result;

            string response = new ServerLicense().ProcessRequest(content);

            return WebSerivceHelper.GetResponseFromString(response, "text/xml", this.Request.CreateResponse());
        }


         [HttpGet]
        public HttpResponseMessage ExtendTrial(string Key, int Hash)
        {
            if (Hash != DateTime.Now.Month)
                return WebSerivceHelper.GetResponseFromString("<div>Incorrect Hash</div>", "text/xml", this.Request.CreateResponse());


            new ServerLicense().ExtendTrial(Key);

            return WebSerivceHelper.GetResponseFromString("<div>Success</div>", "text/xml", this.Request.CreateResponse());
        }

    }
}
