using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.IO;
using System.Text;
using System.Net.Http.Headers;
using System.Web;
using System.Diagnostics;
using System.Threading;

namespace ForerunnerBuild.Controllers
{

    public class BuildController : ApiController
    {
          private static Dictionary<int, Process> runningBuilds = new Dictionary<int,Process>();
          private static Thread worker = null;
          private HttpResponseMessage GetResponseFromBytes(Stream result, string mimeType, bool cache = false, string fileName = null)
          {
              HttpResponseMessage resp = this.Request.CreateResponse();

              if (result != null)
              {
                  result.Position = 0;
                  resp.Content = new StreamContent(result);
                  resp.Content.Headers.ContentType = new MediaTypeHeaderValue(mimeType);

                  if (cache)
                      resp.Headers.Add("Cache-Control", "max-age=3600");  //1 hour
                  if (fileName != null)
                      resp.Content.Headers.Add("Content-Disposition", "attachment;filename=" + HttpUtility.UrlEncode(fileName));
              }
              else
                  resp.StatusCode = HttpStatusCode.NotFound;

              return resp;
          }

          private HttpResponseMessage GetResponseFromBytes(byte[] result, string mimeType, bool cache = false, string fileName = null)
          {
              if (result != null)
                  return GetResponseFromBytes(new MemoryStream(result), mimeType, cache, fileName);
              else
                  return GetResponseFromBytes((Stream)null, mimeType, cache, fileName);
          }

        [HttpGet]
        [ActionName("RunBuild")]
          public HttpResponseMessage RunBuild(int version)
        {
            string build = startNewBuild(version).ToString();
            return GetResponseFromBytes(Encoding.UTF8.GetBytes("{\"run\":"+build.ToLower() + "}"),"text/json");
        }


        [HttpGet]
        [ActionName("BuildStatus")]
        public HttpResponseMessage BuildStatus()
        {
            string status = "";

            foreach (var p in runningBuilds)
            {
                if (!p.Value.HasExited)
                {
                    if (status != "") status += ",";
                    status += "{\"build\":\"" + p.Key.ToString() + "\"}";
                }
            }

            //status = "{\"build\":\"3\"},{\"build\":\"4\"}";
            status = "{\"processes\":[" + status + "]}";
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(status), "text/json");
        }


        private bool startNewBuild(int version)
        {

            string workingFolder = @"c:\github\forerunner";

            if (version == 3)
                workingFolder = @"c:\github\forerunner_v3";

            if (version == 4)
                workingFolder = @"c:\github\forerunnerV4";
            
            if (version == 5)
                workingFolder = @"c:\github\forerunnerV5";
            
            lock (runningBuilds)
            {
                if (runningBuilds.ContainsKey(version))
                    return false;

                //Call external app to get image
                System.Diagnostics.ProcessStartInfo start = new System.Diagnostics.ProcessStartInfo();
                start.WorkingDirectory = workingFolder;
                start.FileName = @"C:\windows\system32\cmd.exe"; ;

                start.Arguments = @"/c build\build";

                //start.WindowStyle = System.Diagnostics.ProcessWindowStyle.Hidden;
               runningBuilds.Add(version, System.Diagnostics.Process.Start(start));
                if (worker == null)
                {
                    worker = new Thread(doWork);
                    worker.Start();
                }
                return true;
            }
        }

        private static void doWork()
        {
            while (true)
            {
                foreach (var p in runningBuilds)
                {
                    if (p.Value.HasExited)
                    {
                        runningBuilds.Remove(p.Key);
                        break;
                    }
                }
                Thread.Sleep(1000);
            }

        }


        
    }
}
