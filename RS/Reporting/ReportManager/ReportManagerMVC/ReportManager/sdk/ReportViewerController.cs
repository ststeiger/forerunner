using System;
using System.Collections.Generic;
using System.Configuration;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web;
using System.Net.Http.Headers;
using System.Text;
using Forerunner.SSRS.Viewer;
using Forerunner;
using System.IO;
using Forerunner.Logging;

namespace ReportManager.Controllers
{
    public class ParametersPostBack
    {
        public string SessionID { get; set; }
        public string ReportPath { get; set; }
        public string ParameterList { get; set; }
        public int PageNumber {get; set;}
        public string DSCredentials { get; set; }
        public string Instance { get; set; }
    }

    [ExceptionLog]
    [Authorize]
    public class ReportViewerController :ApiController
    {
        private string url = ConfigurationManager.AppSettings["Forerunner.ReportServerWSUrl"];
        private int ReportServerTimeout = ForerunnerUtil.GetAppSetting("Forerunner.ReportServerTimeout", 100000);
        private Forerunner.Config.WebConfigSection webConfigSection = Forerunner.Config.WebConfigSection.GetConfigSection();
        
        static  ReportViewerController()
        {
            ForerunnerUtil.CheckSSLConfig();
            
        }
 
        private ReportViewer GetReportViewer(string instance)
        {
            ReportViewer rv = ForerunnerUtil.GetReportViewerInstance(instance, url, ReportServerTimeout, webConfigSection);

            //If you need to specify your own credentials set them here, otherwise we will the forms auth cookie or the default network credentials
            //rv.SetCredentials(new NetworkCredential("TestAccount",  "TestPWD!","Forerunner"));

            //If you wish to use the service account
            //rv.SetCredentials(CredentialCache.DefaultCredentials);

            return rv;
        }

        
        private HttpResponseMessage GetResponseFromBytes(byte[] result, string mimeType, bool cache = false, string fileName = null)
        {
            if (result != null)
                return GetResponseFromBytes(new MemoryStream(result), mimeType, cache, fileName);
            else
                return GetResponseFromBytes((Stream)null, mimeType, cache, fileName);
        }

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
        private HttpResponseMessage ReturnError(Exception e)
        {
            byte[] result = null;
            result = Encoding.UTF8.GetBytes(Forerunner.JsonUtility.WriteExceptionJSON(e));
            return GetResponseFromBytes(result, "text/JSON");
        }
     
        [AllowAnonymous]
        [HttpGet]
        [ActionName("AcceptLanguage")]
        public HttpResponseMessage AcceptLanguage()
        {
            HttpHeaderValueCollection<StringWithQualityHeaderValue> acceptLanguage = this.Request.Headers.AcceptLanguage;
            List<string> listOfLanguages = new List<string>();
            foreach (StringWithQualityHeaderValue value in acceptLanguage)
            {
                if (value.Value != null && value.Value != "")
                    listOfLanguages.Add(value.Value);
            }
            byte[] result = Encoding.UTF8.GetBytes(JsonUtility.ConvertListToJSON(listOfLanguages));
            return GetResponseFromBytes(result, "text/json");
        }

        [HttpGet]
        [ActionName("Image")]
        public HttpResponseMessage Image( string SessionID, string ImageID, string instance = null)
        {
            try
            {
                byte[] result = null;
                string mimeType;
                result = GetReportViewer(instance).GetImage(SessionID, ImageID, out mimeType);
                return GetResponseFromBytes(result, mimeType,true);
            }
            catch(Exception e)
            {
                ExceptionLogGenerator.LogException(e);
                return ReturnError(e);
            }
            
        }

        [HttpGet]
        [ActionName("Thumbnail")]
        public HttpResponseMessage Thumbnail(string ReportPath, string SessionID, int PageNumber, double maxHeightToWidthRatio = 1.2, string instance = null)
        {
            byte[] result = null;
            try
            {                
                result = GetReportViewer(instance).GetThumbnail(ReportPath, SessionID, PageNumber.ToString(), maxHeightToWidthRatio);
                return GetResponseFromBytes(result, "image/JPEG",true);

            }
            catch (Exception e)
            {
                ExceptionLogGenerator.LogException(e);
                return GetResponseFromBytes((Stream) null, "image/JPEG", true);
            }            
        }

        [HttpPost]
        [ActionName("ReportJSON")]
        public HttpResponseMessage ReportJSON(ParametersPostBack postBackValue)
        {
            try
            {
               return GetResponseFromBytes(GetReportViewer(postBackValue.Instance).GetReportJson(postBackValue.ReportPath, postBackValue.SessionID, postBackValue.PageNumber.ToString(), postBackValue.ParameterList, postBackValue.DSCredentials), "text/JSON");
            }
            catch (Exception e)
            {
                ExceptionLogGenerator.LogException(e);
                return ReturnError(e);
            }
        }

        [HttpPost]
        [ActionName("ParameterJSON")]
        public HttpResponseMessage ParameterJSON(ParametersPostBack postBackValue)
        {
            try
            {
                byte[] result = null;
                result = Encoding.UTF8.GetBytes(GetReportViewer(postBackValue.Instance).GetParameterJson(postBackValue.ReportPath, postBackValue.SessionID, postBackValue.ParameterList, postBackValue.DSCredentials));
                return GetResponseFromBytes(result, "text/JSON");
            }
            catch (Exception e)
            {
                ExceptionLogGenerator.LogException(e);
                return ReturnError(e);
            }       
            
        }

        [HttpGet]
        [ActionName("DocMapJSON")]
        public HttpResponseMessage DocMapJSON(string SessionID, string instance = null)
        {
            try
            {
                byte[] result = null;
                result = Encoding.UTF8.GetBytes(GetReportViewer(instance).GetDocMapJson(SessionID));
                return GetResponseFromBytes(result, "text/JSON");
            }
            catch (Exception e)
            {
                ExceptionLogGenerator.LogException(e);
                return ReturnError(e);
            }

        }

        [HttpGet]
        [ActionName("SortReport")]
        public HttpResponseMessage SortReport(string SessionID, string SortItem, string Direction, bool ClearExistingSort = true, string instance = null)
        {
            
            try
            {
                byte[] result = null;
                result = Encoding.UTF8.GetBytes(GetReportViewer(instance).SortReport(SessionID, SortItem, Direction, ClearExistingSort));
                return GetResponseFromBytes(result, "text/JSON");
            }
            catch (Exception e)
            {
                ExceptionLogGenerator.LogException(e);
                return ReturnError(e);
            }

        }

        [HttpGet]
        public HttpResponseMessage PingSession(string PingSessionID, string instance = null)
        {
            try
            {
                byte[] result = null;
                result = Encoding.UTF8.GetBytes(GetReportViewer(instance).pingSession(PingSessionID));
                return GetResponseFromBytes(result, "text/JSON");
            }
            catch (Exception e)
            {
                ExceptionLogGenerator.LogException(e);
                return ReturnError(e);
            }
         

        }

        [HttpPost]
        public void WriteClientErrorLog(string ReportPath, string ErrorMsg)
        {
            //write error message from client into the log file
        }

        [HttpGet]
        public HttpResponseMessage NavigateTo(string NavType, string SessionID, string UniqueID, string instance = null)
        {
            try
            {
                byte[] result = null;
                result = GetReportViewer(instance).NavigateTo(NavType,SessionID,UniqueID);
                return GetResponseFromBytes(result, "text/JSON");
            }
            catch (Exception e)
            {
                ExceptionLogGenerator.LogException(e);
                return ReturnError(e);
            }

        }

        [HttpGet]
        public HttpResponseMessage FindString(string SessionID, int StartPage, int EndPage, string FindValue, string instance = null)
        {

            try
            {
                byte[] result = null;
                result = Encoding.UTF8.GetBytes(GetReportViewer(instance).FindString(SessionID, StartPage, EndPage, FindValue));
                return GetResponseFromBytes(result, "text/JSON");
            }
            catch (Exception e)
            {
                ExceptionLogGenerator.LogException(e);
                return ReturnError(e);
            }

        }

        [HttpGet]
        public HttpResponseMessage ExportReport(string ReportPath, string SessionID, string ExportType, string instance = null)
        {
            try
            {
                byte[] result = null;
                string mimeType;
                string fileName;
                result = GetReportViewer(instance).RenderExtension(ReportPath, SessionID, ExportType, out mimeType, out fileName);
                return GetResponseFromBytes(result, mimeType, false, fileName);
            }
            catch(Exception e)
            {
                ExceptionLogGenerator.LogException(e);
                return ReturnError(e);
            }
         
        }

        [HttpGet]
        public HttpResponseMessage PrintReport(string ReportPath, string SessionID, string PrintPropertyString, string instance = null)
        {
            try
            {
                byte[] result = null;
                string mimeType;
                string fileName;
                result = GetReportViewer(instance).PrintExport(ReportPath, SessionID, PrintPropertyString, out mimeType, out fileName);
                return GetResponseFromBytes(result, mimeType, false);
            }
            catch (Exception e)
            {
                ExceptionLogGenerator.LogException(e);
                return ReturnError(e);
            }
        }

        [AllowAnonymous]
        [HttpGet]
        [ActionName("LoginUrl")]
        public HttpResponseMessage LoginUrl()
        {
            try
            {
                string loginUrl = Forerunner.Security.AuthenticationMode.GetLoginUrl();
                string response = "{\"LoginUrl\" : \"" + loginUrl + "\"}";
                return GetResponseFromBytes(Encoding.UTF8.GetBytes(response), "text/JSON");
            }
            catch (Exception e)
            {
                ExceptionLogGenerator.LogException(e);
                return ReturnError(e);
            }
        }
    }
}
