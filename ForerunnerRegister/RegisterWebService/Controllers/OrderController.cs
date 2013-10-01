using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.IO;
using ForerunnerWebService;

namespace RegisterWebService.Controllers
{
    public class OrderController : ApiController
    {


        // POST api/order
        public void Post()
        {

            string VerifyHeader = "No Header";
            
            if (this.Request.Headers.Contains("HTTP_X_SHOPIFY_HMAC_SHA256"))
                VerifyHeader = this.Request.Headers.GetValues("HTTP_X_SHOPIFY_HMAC_SHA256").FirstOrDefault();
            string content = this.Request.Content.ReadAsStringAsync().Result;

            int sindex = content.IndexOf("?>");

            if (sindex > 0)
                content = content.Substring(sindex+2);
            new Order().AddWorkerNewShopifyOrder(content, VerifyHeader);
            
            
        }

    }
}
