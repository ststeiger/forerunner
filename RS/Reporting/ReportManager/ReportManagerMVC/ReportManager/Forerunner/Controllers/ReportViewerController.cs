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
using ReportManager.Util.Logging;

namespace ReportManager.Controllers
{
    [ExceptionLog]
    [Authorize]
    public class ReportViewerController :ApiController
    {
        private string url = ConfigurationManager.AppSettings["Forerunner.ReportServerWSUrl"];

        private ReportViewer GetReportViewer()
        {
            //Put application security here
            ReportViewer rep = new ReportViewer(url);
            return rep;
        }

        private HttpResponseMessage GetResponseFromBytes(byte[] result, string mimeType, bool cache = false, string fileName = null)
        {
            HttpResponseMessage resp = this.Request.CreateResponse();

            if (result != null)
            {
                resp.Content = new ByteArrayContent(result); ;
                resp.Content.Headers.ContentType = new MediaTypeHeaderValue(mimeType);
                if (cache)
                    resp.Headers.Add("Cache-Control", "max-age=86400");
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

        [HttpGet]        
        public HttpResponseMessage Image( string SessionID, string ImageID)
        {
            try
            {
                byte[] result = null;
                string mimeType;
                result = GetReportViewer().GetImage(SessionID, ImageID, out mimeType);
                return GetResponseFromBytes(result, mimeType);
            }
            catch(Exception e)
            {
                return ReturnError(e);
            }
            
        }

        [HttpGet]
        public HttpResponseMessage Thumbnail(string ReportPath, string SessionID, int PageNumber, double maxHeightToWidthRatio = 1.2)
        {
            try
            {
                byte[] result = null;
                result = GetReportViewer().GetThumbnail(HttpUtility.UrlDecode(ReportPath), SessionID, PageNumber.ToString(), maxHeightToWidthRatio);
                return GetResponseFromBytes(result, "image/JPEG",true);

            }
            catch (Exception e)
            {
                return ReturnError(e);
            }            
        }

        [HttpGet]
        public HttpResponseMessage ReportJSON( string ReportPath, string SessionID, int PageNumber, string ParameterList)
        {
            try
            {
                byte[] result = null;
                result = Encoding.UTF8.GetBytes(GetReportViewer().GetReportJson(HttpUtility.UrlDecode(ReportPath), SessionID, PageNumber.ToString(), ParameterList));
                return GetResponseFromBytes(result, "text/JSON");
            }
            catch (Exception e)
            {
                return ReturnError(e);
            }        
        }

        [HttpGet]
        public HttpResponseMessage ParameterJSON( string ReportPath)
        {
            try
            {
                byte[] result = null;
                result = Encoding.UTF8.GetBytes(GetReportViewer().GetParameterJson(HttpUtility.UrlDecode(ReportPath)));
                return GetResponseFromBytes(result, "text/JSON");
            }
            catch (Exception e)
            {
                return ReturnError(e);
            }       
            
        }

        [HttpGet]
        public HttpResponseMessage DocMapJSON(string SessionID)
        {
            try
            {
                byte[] result = null;
                result = Encoding.UTF8.GetBytes(GetReportViewer().GetDocMapJson(SessionID));
                return GetResponseFromBytes(result, "text/JSON");
            }
            catch (Exception e)
            {
                return ReturnError(e);
            }

        }

        [HttpGet]
        public HttpResponseMessage SortReport(string SessionID, string SortItem, string Direction)
        {

            try
            {
                byte[] result = null;
                result = Encoding.UTF8.GetBytes(GetReportViewer().SortReport(SessionID, SortItem, Direction));
                return GetResponseFromBytes(result, "text/JSON");
            }
            catch (Exception e)
            {
                return ReturnError(e);
            }

        }

       [HttpGet]
        public HttpResponseMessage PingSession(string PingSessionID)
        {
            try
            {
                byte[] result = null;
                result = Encoding.UTF8.GetBytes(GetReportViewer().pingSession(PingSessionID));
                return GetResponseFromBytes(result, "text/JSON");
            }
            catch (Exception e)
            {
                return ReturnError(e);
            }
         

        }

        [HttpPost]
        public void WriteClientErrorLog(string ReportPath, string ErrorMsg)
        {
            //write error message from client into the log file
        }

        [HttpGet]
        public HttpResponseMessage NavigateTo(string NavType, string SessionID, string UniqueID)
        {
            try
            {
                byte[] result = null;
                result = GetReportViewer().NavigateTo(NavType,SessionID,UniqueID);
                return GetResponseFromBytes(result, "text/JSON");
            }
            catch (Exception e)
            {
                return ReturnError(e);
            }

        }

        [HttpGet]
        public HttpResponseMessage FindString(string SessionID, int StartPage, int EndPage, string FindValue)
        {

            try
            {
                byte[] result = null;
                result = Encoding.UTF8.GetBytes(GetReportViewer().FindString(SessionID, StartPage, EndPage, FindValue));
                return GetResponseFromBytes(result, "text/JSON");
            }
            catch (Exception e)
            {
                return ReturnError(e);
            }

        }

        [HttpGet]
        public HttpResponseMessage ExportReport(string ReportPath, string SessionID, string ParameterList, string ExportType)
        {
            try
            {
                byte[] result = null;
                string mimeType;
                string fileName;
                result = GetReportViewer().RenderExtension(ReportPath, SessionID, ParameterList, ExportType, out mimeType, out fileName);
                return GetResponseFromBytes(result, mimeType, false, fileName);
            }
            catch(Exception e)
            {
                return ReturnError(e);
            }
         
        }

        [HttpGet]
        public HttpResponseMessage PrintReport(string ReportPath, string SessionID, string Parameterlist, string PrintPropertyString)
        {
            try
            {
                byte[] result = null;
                string mimeType;
                string fileName;
                result = GetReportViewer().PrintExport(ReportPath, SessionID, Parameterlist, PrintPropertyString, out mimeType, out fileName);
                return GetResponseFromBytes(result, mimeType, false, fileName);
            }
            catch (Exception e)
            {
                return ReturnError(e);
            }
        }
    }
}
