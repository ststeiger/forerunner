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
using Forerunner.Security;

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
    public class LoadReportDefPostBack
    {
        public string RDL { get; set; }
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

            // If using SSRS custom authentication
            //rv.rs.LogonUser("CustomUserName", "CustomerPassword", "CustomAuthority or NULL");

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
                {
                    try
                    {
                        resp.Content.Headers.Add("Content-Disposition", "attachment;filename=" + HttpUtility.UrlEncode(fileName));
                    }
                    catch
                    {
                        resp.Content.Headers.Add("Content-Disposition", "attachment;filename=temp." + fileName.Substring(fileName.LastIndexOf(".")));
                    }
                }
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
     
        /// <summary>
        /// Returns acceptable language choices as defined by the browser
        /// </summary>
        /// <returns>JSON array. E.g., ["en","en-US"] </returns>
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

        /// <summary>
        /// Used to get report images from the server. Called from the Report Renderer.
        /// </summary>
        /// <param name="SessionID">Current session id</param>
        /// <param name="ImageID">Image id</param>
        /// <param name="instance"></param>
        /// <returns>Image mime type. E.g., "image/jpeg"</returns>
        [HttpGet]
        [ActionName("Image")]
        public HttpResponseMessage Image( string SessionID, string ImageID, string instance = null)
        {

            byte[] retval = null;
            string mimeType = null;
            try
            {
                ImpersonateCaller.RunAsCurrentUser(() =>
                {                    
                    retval = GetReportViewer(instance).GetImage(SessionID, ImageID, out mimeType);                    
                });
                return GetResponseFromBytes(retval, mimeType, true);
            }            
            catch(Exception e)
            {
                ExceptionLogGenerator.LogException(e);
                return ReturnError(e);
            }
            
        }

        /// <summary>
        /// Returns a thumbnail image of the given ReportPath for the specified page
        /// </summary>
        /// <param name="ReportPath">Report Path</param>
        /// <param name="SessionID">Current Session id</param>
        /// <param name="PageNumber">Page number</param>
        /// <param name="maxHeightToWidthRatio">Defaults to 1.2</param>
        /// <param name="instance"></param>
        /// <returns>Mime type "image/JPEG"</returns>
        [HttpGet]
        [ActionName("Thumbnail")]
        public HttpResponseMessage Thumbnail(string ReportPath, string SessionID, int PageNumber, double maxHeightToWidthRatio = 1.2, string instance = null)
        {
            byte[] result = null;
            try
            {
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    result = GetReportViewer(instance).GetThumbnail(ReportPath, SessionID, PageNumber.ToString(), maxHeightToWidthRatio);
                });
                return GetResponseFromBytes(result, "image/JPEG",true);

            }
            catch (Exception e)
            {
                ExceptionLogGenerator.LogException(e);
                return GetResponseFromBytes((Stream) null, "image/JPEG", true);
            }            
        }

        /// <summary>
        /// Retrieves the session ID for the report created with the given RDL
        /// specified PageNumber.
        /// </summary>
        /// <param name="postBackValue">RDL</param>
        /// <returns>JSON object with SessionID and any warnings to dynamic report</returns>
        [HttpPost]
        [ActionName("LoadReportDefinition")]
        public HttpResponseMessage LoadReportDefinition(LoadReportDefPostBack postBackValue)
        {
            try
            {      
                string result = "";
                
                 ImpersonateCaller.RunAsCurrentUser(() =>                
                {
                    result = GetReportViewer(postBackValue.Instance).LoadReportDefinition(postBackValue.RDL);
                });

                byte[] JSON = Encoding.UTF8.GetBytes(result);

                return GetResponseFromBytes(JSON, "text/JSON");
            }
            catch (Exception e)
            {
                ExceptionLogGenerator.LogException(e);
                return ReturnError(e);
            }
        }
        /// <summary>
        /// Retrieves the JSON representation ReportPath given the ParameterList for the
        /// specified PageNumber.
        /// </summary>
        /// <param name="postBackValue">JSON object</param>
        /// <returns>JSON object used to render the report</returns>
        [HttpPost]
        [ActionName("ReportJSON")]
        public HttpResponseMessage ReportJSON(ParametersPostBack postBackValue)
        {
            try
            {
                Stream result = null;
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    result = GetReportViewer(postBackValue.Instance).GetReportJson(postBackValue.ReportPath, postBackValue.SessionID, postBackValue.PageNumber.ToString(), postBackValue.ParameterList, postBackValue.DSCredentials);
                });

                return GetResponseFromBytes(result, "text/JSON");
            }
            catch (Exception e)
            {
                ExceptionLogGenerator.LogException(e);
                return ReturnError(e);
            }
        }

        /// <summary>
        /// Returns the parameters for the given ReportPath, PageNumber and current
        /// ParameterList.
        /// </summary>
        /// <param name="postBackValue">JSON object</param>
        /// <returns>JSON object containing the parameter list</returns>
        [HttpPost]
        [ActionName("ParameterJSON")]
        public HttpResponseMessage ParameterJSON(ParametersPostBack postBackValue)
        {
            try
            {
                byte[] result = null;
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    result = Encoding.UTF8.GetBytes(GetReportViewer(postBackValue.Instance).GetParameterJson(postBackValue.ReportPath, postBackValue.SessionID, postBackValue.ParameterList, postBackValue.DSCredentials));
                });                
                return GetResponseFromBytes(result, "text/JSON");
            }
            catch (Exception e)
            {
                ExceptionLogGenerator.LogException(e);
                return ReturnError(e);
            }       
            
        }
        /// <summary>
        /// Resets the report, to get new data
        /// </summary>
        /// <param name="SessionID">Current session id</param>
        /// <param name="instance"></param>       
        [HttpGet]
        [ActionName("ResetExecution")]
        public HttpResponseMessage ResetExecution(string SessionID, string instance = null)
        {
            try
            {                
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    GetReportViewer(instance).ResetExecution(SessionID);
                });

                return GetResponseFromBytes(Encoding.UTF8.GetBytes("{}"), "text/JSON");
            }
            catch (Exception e)
            {
                ExceptionLogGenerator.LogException(e);
                return ReturnError(e);
            }

        }    

        /// <summary>
        /// Returns the document map structure for the current SessionID
        /// </summary>
        /// <param name="SessionID">Current session id</param>
        /// <param name="instance"></param>
        /// <returns>JSON object containing the document map</returns>
        [HttpGet]
        [ActionName("DocMapJSON")]
        public HttpResponseMessage DocMapJSON(string SessionID, string instance = null)
        {
            try
            {
                byte[] result = null;
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                    result = Encoding.UTF8.GetBytes(GetReportViewer(instance).GetDocMapJson(SessionID));
                }); 
                
                return GetResponseFromBytes(result, "text/JSON");
            }
            catch (Exception e)
            {
                ExceptionLogGenerator.LogException(e);
                return ReturnError(e);
            }

        }

        /// <summary>
        /// Will sort the current report based upon the SortItem and Direction
        /// </summary>
        /// <param name="SessionID">Current Session id</param>
        /// <param name="SortItem">Sort Item</param>
        /// <param name="Direction">Direction</param>
        /// <param name="ClearExistingSort">Defaults to true</param>
        /// <param name="instance"></param>
        /// <returns>JSON object indicating status</returns>
        [HttpGet]
        [ActionName("SortReport")]
        public HttpResponseMessage SortReport(string SessionID, string SortItem, string Direction, bool ClearExistingSort = true, string instance = null)
        {
            
            try
            {
                byte[] result = null;
                ImpersonateCaller.RunAsCurrentUser(() =>
               {
                   result = Encoding.UTF8.GetBytes(GetReportViewer(instance).SortReport(SessionID, SortItem, Direction, ClearExistingSort));
               });
                return GetResponseFromBytes(result, "text/JSON");
            }
            catch (Exception e)
            {
                ExceptionLogGenerator.LogException(e);
                return ReturnError(e);
            }

        }

        /// <summary>
        /// Used to keep the current session active
        /// </summary>
        /// <param name="PingSessionID">Current Session is</param>
        /// <param name="instance"></param>
        /// <returns>JSON object indicating status</returns>
        [HttpGet]
        public HttpResponseMessage PingSession(string PingSessionID, string instance = null)
        {
            try
            {
                byte[] result = null;
                ImpersonateCaller.RunAsCurrentUser(() =>
               {
                   result = Encoding.UTF8.GetBytes(GetReportViewer(instance).pingSession(PingSessionID));
               });

                return GetResponseFromBytes(result, "text/JSON");
            }
            catch (Exception e)
            {
                ExceptionLogGenerator.LogException(e);
                return ReturnError(e);
            }
         

        }

        /// <summary>
        /// Not implemented
        /// </summary>
        /// <param name="ReportPath"></param>
        /// <param name="ErrorMsg"></param>
        [HttpPost]
        public void WriteClientErrorLog(string ReportPath, string ErrorMsg)
        {
            //write error message from client into the log file
        }

        /// <summary>
        /// Used to navigate to bookmarks, drill through reports, etc.
        /// </summary>
        /// <param name="NavType">"toggle", "bookmark", "drillthrough" or "documentMap"</param>
        /// <param name="SessionID">Current session id</param>
        /// <param name="UniqueID">Unique id of the NavigateTo action</param>
        /// <param name="instance"></param>
        /// <returns>JSON object indicating status. E.g. 
        /// {
        ///     "Result":true,
        ///     "ToggleID":"48iT0R0x0"
        /// }
        /// </returns>
        [HttpGet]
        public HttpResponseMessage NavigateTo(string NavType, string SessionID, string UniqueID, string instance = null)
        {
            try
            {
                byte[] result = null;
                ImpersonateCaller.RunAsCurrentUser(() =>
               {
                   result = GetReportViewer(instance).NavigateTo(NavType, SessionID, UniqueID);
               });
                return GetResponseFromBytes(result, "text/JSON");
            }
            catch (Exception e)
            {
                ExceptionLogGenerator.LogException(e);
                return ReturnError(e);
            }

        }

        /// <summary>
        /// Used to find the given FindValue within the specified page range
        /// </summary>
        /// <param name="SessionID">Current session id</param>
        /// <param name="StartPage">Start page</param>
        /// <param name="EndPage">End page</param>
        /// <param name="FindValue">Find value</param>
        /// <param name="instance"></param>
        /// <returns>JSON object indicating the result of the find. E.g., 
        /// {
        ///     "NewPage":1
        /// }
        /// </returns>
        [HttpGet]
        public HttpResponseMessage FindString(string SessionID, int StartPage, int EndPage, string FindValue, string instance = null)
        {

            try
            {
                byte[] result = null;
                ImpersonateCaller.RunAsCurrentUser(() =>
               {
                   result = Encoding.UTF8.GetBytes(GetReportViewer(instance).FindString(SessionID, StartPage, EndPage, FindValue));
               });
               return GetResponseFromBytes(result, "text/JSON");
            }
            catch (Exception e)
            {
                ExceptionLogGenerator.LogException(e);
                return ReturnError(e);
            }

        }

        /// <summary>
        /// Returns a mime object based on the given ExportType
        /// </summary>
        /// <param name="ReportPath">Path to the report</param>
        /// <param name="SessionID">Current session id</param>
        /// <param name="ExportType">Export type: "XML", "CSV", "PDF", "MHTML", "EXCELOPENXML", "IMAGE" or "WORDOPENXML"</param>
        /// <param name="instance"></param>
        /// <returns>Mime object corresponding to the given ExportType</returns>
        [HttpGet]
        public HttpResponseMessage ExportReport(string ReportPath, string SessionID, string ExportType, string instance = null)
        {
            try
            {
                byte[] result = null;
                string mimeType = null;
                string fileName = null;
                ImpersonateCaller.RunAsCurrentUser(() =>
               {
                   result = GetReportViewer(instance).RenderExtension(ReportPath, SessionID, ExportType, out mimeType, out fileName);
               });
               return GetResponseFromBytes(result, mimeType, false, fileName);
            }
            catch(Exception e)
            {
                ExceptionLogGenerator.LogException(e);
                return ReturnError(e);
            }
         
        }

        /// <summary>
        /// Causes the print dialog of the PDF viewer to automatically be launched for printing. No
        /// ActiveX control (yeah!).
        /// </summary>
        /// <param name="ReportPath">Report path</param>
        /// <param name="SessionID">Current session id</param>
        /// <param name="PrintPropertyString">Print string. E.g., {"PrintPropertyList":[{"key":"PageHeight",
        /// "value":"11"},{"key":"PageWidth","value":"8.5"},{"key":"MarginTop","value":"1"},{"key":"MarginBottom",
        /// "value":"1"},{"key":"MarginLeft","value":"1"},{"key":"MarginRight","value":"1"}]}</param>
        /// <param name="instance"></param>
        /// <returns>"application/pdf" object</returns>
        [HttpGet]
        public HttpResponseMessage PrintReport(string ReportPath, string SessionID, string PrintPropertyString, string instance = null)
        {
            try
            {
                byte[] result = null;
                string mimeType = null;
                string fileName = null;
                ImpersonateCaller.RunAsCurrentUser(() =>
                {
                  result = GetReportViewer(instance).PrintExport(ReportPath, SessionID, PrintPropertyString, out mimeType, out fileName);
                });

                return GetResponseFromBytes(result, mimeType, false);
            }
            catch (Exception e)
            {
                ExceptionLogGenerator.LogException(e);
                return ReturnError(e);
            }
        }

        /// <summary>
        /// Returns the LoginUrl
        /// </summary>
        /// <returns>JSON object containing the Login URL. E.g.,
        /// {
        ///     "LoginUrl" : "~/Login/Login"
        /// }
        /// </returns>
        [AllowAnonymous]
        [HttpGet]
        [ActionName("LoginUrl")]
        public HttpResponseMessage LoginUrl()
        {
            string response = "";
            try
            {
                string loginUrl = Forerunner.Security.AuthenticationMode.GetLoginUrl();
                response = "{\"LoginUrl\" : \"" + loginUrl + "\"}";
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
