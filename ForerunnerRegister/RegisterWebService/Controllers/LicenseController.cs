using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using ForerunnerRegister;
using ForerunnerWebService;

namespace RegisterWebService.Controllers
{
    public class LicenseController : ApiController
    {


        // POST api/license
        public HttpResponseMessage Post()
        {
            string content = this.Request.Content.ReadAsStringAsync().Result;

            string response = new License().ProcessRequest(content);

            return WebSerivceHelper.GetResponseFromString(response, "text/xml", this.Request.CreateResponse());
        }

 

    }
}
