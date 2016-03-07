﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Net;
using Microsoft.Reporting.WebForms;

namespace WebApplication1
{
    
    public partial class _Default : Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            //NetworkCredential myCred = new NetworkCredential("jason", "Shadow33", "ForerunnerWin7");

            ReportViewer1.Width = 800;
            ReportViewer1.Height = 600;
            ReportViewer1.ProcessingMode = Microsoft.Reporting.WebForms.ProcessingMode.Remote;
            ReportViewer1.ServerReport.ReportServerUrl = new Uri("http://192.168.1.27/reportserver/");
            ReportViewer1.ServerReport.ReportPath = "/AdventureWorks 2008R2/Sales By Sales Person";
            ReportViewer1.ServerReport.ReportServerCredentials = new CustomReportCredentials("jason", "Shadow33", "ForerunnerWin7");
            ReportViewer1.ShowToolBar = false;
            ReportViewer1.CurrentPage = 1;
            ReportViewer1.ServerReport.Refresh();
        }
    }



    public class CustomReportCredentials : IReportServerCredentials
    {
        private string _UserName;
        private string _PassWord;
        private string _DomainName;

        public CustomReportCredentials(string UserName, string PassWord, string DomainName)
        {
            _UserName = UserName;
            _PassWord = PassWord;
            _DomainName = DomainName;
        }

        public System.Security.Principal.WindowsIdentity ImpersonationUser
        {
            get { return null; }
        }

        public ICredentials NetworkCredentials
        {
            get { return new NetworkCredential(_UserName, _PassWord, _DomainName); }
        }

        public bool GetFormsCredentials(out Cookie authCookie, out string user,
         out string password, out string authority)
        {
            authCookie = null;
            user = password = authority = null;
            return false;
        }
    }

}