﻿using System;
using System.Collections.Generic;
using System.Configuration;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web;
using System.Net.Http.Headers;
using System.Text;
using Forerunner.ReportViewer;
using System.IO;
using ReportManager.Util.Logging;

namespace ReportManager.Controllers
{
    [ExceptionLog]
    public class ReportViewerController :ApiController
    {
        private string accountName = ConfigurationManager.AppSettings["ForeRunner.TestAccount"];
        private string accountPWD = ConfigurationManager.AppSettings["ForeRunner.TestAccountPWD"];
        private string domainName = ConfigurationManager.AppSettings["ForeRunner.TestAccountDomain"];
        
        [HttpGet]        
        public HttpResponseMessage GetImage(string ReportServerURL, string SessionID, string ImageID)
        {
            ReportViewer rep = new ReportViewer(HttpUtility.UrlDecode(ReportServerURL));
            string mimeType;
            byte[] result;
            HttpResponseMessage resp = this.Request.CreateResponse(); 

            //Application will need to handel security
            rep.SetCredentials(new Credentials(Credentials.SecurityTypeEnum.Custom, accountName, domainName, accountPWD));

            result = rep.GetImage(SessionID, ImageID, out mimeType);            
            if (result != null)
            {                
                resp.Content = new ByteArrayContent(result); ;
                resp.Content.Headers.ContentType = new MediaTypeHeaderValue(mimeType);
            }
            else
                resp.StatusCode = HttpStatusCode.NotFound;

            return resp;
        }

        [HttpGet]
        public HttpResponseMessage GetThumbnail(string ReportServerURL, string ReportPath, string SessionID, int PageNumber, double maxHeightToWidthRatio = 0)
        {

            ReportViewer rep = new ReportViewer(HttpUtility.UrlDecode(ReportServerURL));
            byte[] result;
            HttpResponseMessage resp = this.Request.CreateResponse();;

            //Application will need to handel security
            rep.SetCredentials(new Credentials(Credentials.SecurityTypeEnum.Custom, accountName, domainName, accountPWD));
            result = rep.GetThumbnail(HttpUtility.UrlDecode(ReportPath), SessionID, PageNumber.ToString(), maxHeightToWidthRatio);

            if (result != null)
            {                
                resp.Content = new ByteArrayContent(result); ;
                resp.Content.Headers.ContentType = new MediaTypeHeaderValue("image/JPEG");
            }
            else
                resp.StatusCode = HttpStatusCode.NotFound;
            
            return resp;
        }

        [HttpGet]
        public HttpResponseMessage GetJSON(string ReportServerURL, string ReportPath, string SessionID, int PageNumber, string ParameterList)
        {
            try
            {
                ReportViewer rep = new ReportViewer(HttpUtility.UrlDecode(ReportServerURL));
                byte[] result;
                HttpResponseMessage resp = this.Request.CreateResponse();
                //Application will need to handel security
                rep.SetCredentials(new Credentials(Credentials.SecurityTypeEnum.Custom, accountName, domainName, accountPWD));

                result = Encoding.UTF8.GetBytes(rep.GetReportJson(HttpUtility.UrlDecode(ReportPath), SessionID, PageNumber.ToString(), ParameterList));
                resp.Content = new ByteArrayContent(result); ;
                resp.Content.Headers.ContentType = new MediaTypeHeaderValue("text/JSON");

                return resp;
            }
            catch (Exception e)
            {
                string error = e.Message;
            }
            return null;
        }

        [HttpGet]
        public HttpResponseMessage GetParameterJSON(string ReportServerURL, string ReportPath)
        {
            ReportViewer rep = new ReportViewer(HttpUtility.UrlDecode(ReportServerURL));
            byte[] result;
            HttpResponseMessage resp = this.Request.CreateResponse();

            rep.SetCredentials(new Credentials(Credentials.SecurityTypeEnum.Custom, accountName, domainName, accountPWD));

            result = Encoding.UTF8.GetBytes(rep.GetParameterJson(HttpUtility.UrlDecode(ReportPath)));
            resp.Content = new ByteArrayContent(result); ;
            resp.Content.Headers.ContentType = new MediaTypeHeaderValue("text/JSON");

            return resp;
        }

        [HttpGet]
        public HttpResponseMessage SortReport(string ReportServerURL, string SessionID, string SortItem, string Direction)
        {           
            ReportViewer rep = new ReportViewer(HttpUtility.UrlDecode(ReportServerURL));
            byte[] result;
            HttpResponseMessage resp = this.Request.CreateResponse();

            //Application will need to handel security
            rep.SetCredentials(new Credentials(Credentials.SecurityTypeEnum.Custom, accountName, domainName, accountPWD));

            result = Encoding.UTF8.GetBytes(rep.SortReport(SessionID, SortItem, Direction));
            resp.Content = new ByteArrayContent(result); ;
            resp.Content.Headers.ContentType = new MediaTypeHeaderValue("text/JSON");

            return resp;
        }

        [HttpGet]
        public HttpResponseMessage ToggleItem(string ReportServerURL, string SessionID, string ToggleID)
        {
            return NavigateTo(NavType.Toggle, ReportServerURL, SessionID, ToggleID);
        }

        [HttpGet]
        public HttpResponseMessage NavigateBookmark(string ReportServerURL, string SessionID, string BookmarkID)
        {
            return NavigateTo(NavType.Bookmark, ReportServerURL, SessionID, BookmarkID);
        }

        [HttpGet]
        public HttpResponseMessage NavigateDrillthrough(string ReportServerURL, string SessionID, string DrillthroughID)
        {
            return NavigateTo(NavType.DrillThrough, ReportServerURL, SessionID, DrillthroughID);
        }

        [HttpGet]
        public HttpResponseMessage NavigateDocumentMap(string ReportServerURL, string SessionID, string DocMapID)
        {
            return NavigateTo(NavType.DocumentMap, ReportServerURL, SessionID, DocMapID);
        }

        [HttpGet]
        public HttpResponseMessage PingSession(string ReportServerURL, string SessionID)
        {
            ReportViewer rep = new ReportViewer(HttpUtility.UrlDecode(ReportServerURL));
            HttpResponseMessage resp = this.Request.CreateResponse();

            //Application will need to handel security
            rep.SetCredentials(new Credentials(Credentials.SecurityTypeEnum.Custom, accountName, domainName, accountPWD));

            rep.pingSession(SessionID);            
            resp.StatusCode = HttpStatusCode.OK;
            return resp;

        }

        [HttpPost]
        public void WriteClientErrorLog(string ReportPath, string ErrorMsg)
        {
            //write error message from client into the log file
        }

        [HttpGet]
        public HttpResponseMessage NavigateTo(NavType type, string ReportServerURL, string SessionID, string UniqueID)
        {
            ReportViewer rep = new ReportViewer(HttpUtility.UrlDecode(ReportServerURL));
            byte[] result = null;
            HttpResponseMessage resp = this.Request.CreateResponse();

            //Application will need to handel security
            rep.SetCredentials(new Credentials(Credentials.SecurityTypeEnum.Custom, accountName, domainName, accountPWD));

            switch (type)
            {
                case NavType.Toggle:
                    result = Encoding.UTF8.GetBytes(rep.ToggleItem(SessionID, UniqueID));
                    break;
                case NavType.Bookmark:
                    result = Encoding.UTF8.GetBytes(rep.NavBookmark(SessionID, UniqueID));
                    break;
                case NavType.DrillThrough:
                    result = Encoding.UTF8.GetBytes(rep.NavigateDrillthrough(SessionID, UniqueID));
                    break;
                case NavType.DocumentMap:
                    result = Encoding.UTF8.GetBytes(rep.NavigateDocumentMap(SessionID, UniqueID));
                    break;
            }

            
            resp.Content = new ByteArrayContent(result); ;
            resp.Content.Headers.ContentType = new MediaTypeHeaderValue("text/JSON");

            return resp;
        }
    }
}
