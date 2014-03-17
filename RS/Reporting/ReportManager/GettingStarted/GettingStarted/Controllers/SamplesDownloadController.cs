using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Web.Http;
using Forerunner.Logging;

namespace SDKSamples.Controllers
{
    [ExceptionLog]
    [AllowAnonymous]
    public class SamplesDownloadController : ApiController
    {
        private Dictionary<string, string> SampleItemMap = new Dictionary<string, string>();

        SamplesDownloadController()
        {
            // Register the known file samples. Note: always make the key lowercase
            SampleItemMap.Add(@"_layout.cshtml", @"Views\shared\_Layout.cshtml");
            SampleItemMap.Add(@"_reportlayout.cshtml", @"Views\shared\_ReportLayout.cshtml");
            SampleItemMap.Add(@"accountcontroller.cs", @"Controllers\AccountController.cs");
            SampleItemMap.Add(@"homecontroller.cs", @"Controllers\HomeController.cs");
            SampleItemMap.Add(@"report.cshtml", @"Views\Home\Report.cshtml");
            SampleItemMap.Add(@"webapiconfig.cs", @"App_Start\WebApiConfig.cs");
        }

        [HttpGet]
        [ActionName("GetSample")]
        public HttpResponseMessage GetSample(string SampleName, string ResponseType)
        {
            HttpResponseMessage resp = this.Request.CreateResponse();

            string RelativeSamplePath;
            bool found = SampleItemMap.TryGetValue(SampleName.ToLower(), out RelativeSamplePath);
            if (!found)
            {
                resp.StatusCode = HttpStatusCode.NotFound;
                return resp;
            }

            if (String.Compare(ResponseType, @"inline", true) == 0)
            {
                GetContent(RelativeSamplePath, "inline", resp);
            }
            else if (String.Compare(ResponseType, @"attachment", true) == 0)
            {
                GetContent(RelativeSamplePath, "attachment", resp);
            }
            else
            {
                resp.StatusCode = HttpStatusCode.BadRequest;
            }

            return resp;
        }

        private void GetContent(string RelativeSamplePath, string Disposition, HttpResponseMessage resp)
        {
            string FullSamplePath = Path.Combine(System.Web.HttpContext.Current.Server.MapPath("~"), RelativeSamplePath);

            byte[] content = null;
            using (FileStream fs = File.Open(FullSamplePath, FileMode.Open))
            {
                content = new byte[fs.Length];
                fs.Read(content, 0, (int)fs.Length);
            }
            HttpResponseMessage response = new HttpResponseMessage(HttpStatusCode.OK);
            resp.Content = new ByteArrayContent(content);
            resp.Content.Headers.ContentType = new MediaTypeHeaderValue("text/plain");
            resp.Content.Headers.ContentDisposition = new ContentDispositionHeaderValue(Disposition)
            {
                FileName = Path.GetFileName(RelativeSamplePath)
            };
        }
    }
}
