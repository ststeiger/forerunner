﻿namespace ReportMannagerConfigTool
{
    public static class StaticMessages
    {
        public static readonly string iisNotInstall = "IIS is not installed or is not running, Please install IIS first.";
        public static readonly string uwsNotInstall = "UWS is not installed or is not running, Please install UWS first.";
        public static readonly string siteEmpty = "Site Name can not be empty!";
        public static readonly string portEmpty = "Port can not be empty!";
        public static readonly string portNotFree = "Port: {0} is not free!";
        public static readonly string commonSuccess = "Update success!";

        public static readonly string deploySuccess = "Deploy to {0} success!";
        public static readonly string connectDBSuccess = "Connection test success!";

        public static readonly string ssrsUpdateSuccess = "Configuration file update success!";
        public static readonly string updateError = "Error occured when update, please try later!";

        public static readonly string reportServerPathEmpty = "Please select report server folder!";
        public static readonly string reportServerPathWrong = "Please make sure 'Web.config', 'rsreportserver.config', 'rssrvpolicy.config' and 'bin' folder are all exist in selected folder!";
        public static readonly string removeExtension = "Are you sure to remove Render Extensions configuration?";
        public static readonly string removeCaption = "Remove";
        public static readonly string removeWebConfigError = "Remove render extension from web.config occured unknown error";
        public static readonly string removeRSReportServerError = "Remove render extension from rsreportserver.config occured unknown error";
        public static readonly string removeRSPolicyError = "Remove render extension from rssrvpolicy.config occured unknown error";
        public static readonly string removeDone = "Remove completed!";

        public static readonly string updateWebConfigError = "Update web.config occured unknown error";
        public static readonly string updateRSReportServerError = "Update rsreportserver.config occured unknown error";
        public static readonly string updateRSPolicyError = "Update rsrvvpolicy.config occured unknown error";
        public static readonly string updateDone = "Update completed!";

        public static readonly string siteExist = "Site name {0} is already exist, please input another name";

        public static readonly string windowsAuth = "Windows";
        public static readonly string formsAuth = "Forms";

        public static readonly string NetworkServiceAccount = "NETWORK SERVICE";
        public static readonly string IISUsrsAccount = "IIS_IUSRS";

        public static readonly string databaseConnectionFail = "Database connection failed: {0}";
        public static readonly string notReportServerDB = "Not a Report Server Database";
        public static readonly string testSuccess = "Success";
        public static readonly string testFail = "Fail";
        public static readonly string webServiceUrlInvalid = "Web Service Url is invalid: {0}";
        public static readonly string webServiceUrlError = "Web Service Url is not work: {0}";
        public static readonly string webServiceUrlIncorrect = "Web Service Url is not correct!"; 

        public static readonly string ssrs2005url = "/ReportService2005.asmx?wsdl";
        public static readonly string ssrs2006url = "/ReportService2006.asmx?wsdl";
        public static readonly string ssrs2005TargetNS = "http://schemas.microsoft.com/sqlserver/2005/06/30/reporting/reportingservices";
        public static readonly string ssrs2006TargetNS = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices";
    }
}
