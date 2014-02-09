﻿using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Net.Http.Headers;
using System.Text;
using Forerunner.SSRS.Management;
using Forerunner.SSRS.Manager;
using Forerunner;
using ReportManager.Util.Logging;

namespace ReportManager.Controllers
{
    public class SaveParameters
    {
        public string reportPath { get; set; }
        public string parameters { get; set; }
    }

    [ExceptionLog]
    [Authorize]
    public class ReportManagerController : ApiController
    {
        private string url = ConfigurationManager.AppSettings["Forerunner.ReportServerWSUrl"];

        private bool IsNativeRS = GetAppSetting("Forerunner.IsNative", true);
        private string SharePointHostName = ConfigurationManager.AppSettings["Forerunner.SharePointHost"];
        private bool useIntegratedSecurity = GetAppSetting("Forerunner.UseIntegratedSecurityForSQL", false);
        private string ReportServerDataSource = ConfigurationManager.AppSettings["Forerunner.ReportServerDataSource"];
        private string ReportServerDB = ConfigurationManager.AppSettings["Forerunner.ReportServerDB"];
        private string ReportServerDBUser = ConfigurationManager.AppSettings["Forerunner.ReportServerDBUser"];
        private string ReportServerDBPWD = ConfigurationManager.AppSettings["Forerunner.ReportServerDBPWD"];
        private string ReportServerDBDomain = ConfigurationManager.AppSettings["Forerunner.ReportServerDBDomain"];
        private string ReportServerSSL = ConfigurationManager.AppSettings["Forerunner.ReportServerSSL"];
        private string DefaultUserDomain = ConfigurationManager.AppSettings["Forerunner.DefaultUserDomain"];

        static private bool GetAppSetting(string key, bool defaultValue)
        {
            string value = ConfigurationManager.AppSettings[key];
            return (value == null) ? defaultValue : String.Equals("true", value.ToLower());
        }
        private Forerunner.SSRS.Manager.ReportManager GetReportManager()
        {
            //Put application security here
            Credentials WSCred = null;
            Credentials DBCred = new Credentials(Credentials.SecurityTypeEnum.Custom, ReportServerDBUser, ReportServerDBDomain == null ? "" : ReportServerDBDomain, ReportServerDBPWD);
            return new Forerunner.SSRS.Manager.ReportManager(url, WSCred, ReportServerDataSource, ReportServerDB, DBCred, useIntegratedSecurity, IsNativeRS, DefaultUserDomain, SharePointHostName);
        }
        private HttpResponseMessage GetResponseFromBytes(byte[] result, string mimeType,bool cache = false)
        {
            HttpResponseMessage resp = this.Request.CreateResponse();

            if (result != null)
            {
                resp.Content = new ByteArrayContent(result); ;
                resp.Content.Headers.ContentType = new MediaTypeHeaderValue(mimeType);
                if (cache)
                    resp.Headers.Add("Cache-Control", "max-age=7887000");  //3 months
            }
            else
                resp.StatusCode = HttpStatusCode.NotFound;

            return resp;
        }
        // GET api/ReportMananger/GetItems
        [HttpGet]
        public IEnumerable<CatalogItem> GetItems(string view, string path)
        {
            
            return GetReportManager().GetItems(view, path);
        }


        [HttpGet]
        [ActionName("Thumbnail")]
        public HttpResponseMessage Thumbnail(string ReportPath,string DefDate)
        {
            return GetResponseFromBytes(GetReportManager().GetCatalogImage(ReportPath), "image/JPEG",true);            
        }

        [HttpGet]
        public HttpResponseMessage UpdateView(string view, string action, string path)
        {
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager().UpdateView(view,action,path)), "text/JSON");
        }

        [HttpGet]
        public HttpResponseMessage IsFavorite(string path)
        {
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager().IsFavorite(path)), "text/JSON");
        }

        [HttpGet]
        public HttpResponseMessage GetUserParameters(string reportPath)
        {
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager().GetUserParameters(reportPath)), "text/JSON");
        }
        [HttpPost]
        public HttpResponseMessage SaveUserParameters(SaveParameters saveParams)
        {
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager().SaveUserParamaters(saveParams.reportPath, saveParams.parameters)), "text/JSON");
        }

        [HttpGet]
        public HttpResponseMessage GetUserSettings()
        {
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager().GetUserSettings()), "text/JSON");
        }
        [HttpGet]
        public HttpResponseMessage SaveUserSettings(string settings)
        {
            return GetResponseFromBytes(Encoding.UTF8.GetBytes(GetReportManager().SaveUserSettings(settings)), "text/JSON");
        }


    }
}