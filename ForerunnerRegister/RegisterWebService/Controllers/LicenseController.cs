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
            string response = new ServerLicense().ExtendTrial(Key, Hash);

			return WebSerivceHelper.GetResponseFromString(response, "text/xml", this.Request.CreateResponse());
		}

        [HttpGet]
        public HttpResponseMessage RunTask(string Data, String taskType)
        {
            new TaskWorker().SaveTask(taskType, Data);

            return WebSerivceHelper.GetResponseFromString("<h1>Saved</h1>", "text/xml", this.Request.CreateResponse());
        }
	}
}
