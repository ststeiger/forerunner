using System;
using System.Collections.Generic;
using System.Configuration;
using System.Diagnostics;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Security.Cryptography.X509Certificates;
using System.Web.UI.HtmlControls;
using Common.Web;
using ForeRunner.Reporting.Extensions.SAMLUtils;

namespace ForeRunner.Reporting.Extensions.SAML
{
    public partial class SSO : System.Web.UI.Page {
        private string GetIssuer()
        {
            return ConfigurationManager.AppSettings["ForeRunnerSAMLExtension.IssuerName"];
        }

        private string GetACSUrl()
        {
            return ConfigurationManager.AppSettings["ForeRunnerSAMLExtension.ACSUrl"];
        }

        private bool GetAuthorityFromForm()
        {
            return ConfigurationManager.AppSettings["GetAuthorityFromForm"] == "true";
        }

        private bool IsSAMLResponse()
        {
            if (HttpContext.Current.Request != null) {
                return (HttpContext.Current.Request["RelayState"] != null || HttpContext.Current.Request.Form["RelayState"] != null) &&
                    HttpContext.Current.Request["SAMLResponse"] != null || HttpContext.Current.Request.Form["SAMLResponse"] != null;
            }
            return false;
        }

        protected void Page_Load(object sender, EventArgs e) {
            if (!IsSAMLResponse())
            {
                CreateSAMLRequestAndCallIDP();
            }
            else
            {
                AssertionConsumerService acs = new AssertionConsumerService();
                acs.ProcessRequest(HttpContext.Current);
            }
        }

        private bool IsReportManager()
        {
            return Request.QueryString["ReturnUrl"].StartsWith("http");
        }

        private void CreateSAMLRequestAndCallIDP()
        {
            string targetUrl = Request.QueryString["ReturnUrl"];
            
            Trace.Write("A request for the page " + targetUrl);
            string authority = null;
            if (GetAuthorityFromForm())
            {
                authority = Request.Form["authority"];
                if (authority == null)
                {
                    authority = Request.QueryString["authority"];
                }
            }
            else
            {
                authority = SAMLHelperBase.GetAuthorityFromUrl(targetUrl, IsReportManager());
            }

            if (authority == null)
            {
                authority = "";
            }
            string idpUrl = SAMLHelperBase.GetIDPUrl(authority);
            // Set Relay State
            // TODO:  Need to encrypt this thing before sending this off.
            // Obviously, all these stuff need to be read from the config too.
            // Need to get the tenant information based on the UrlReferrer.
            string relayStateString = "authority=" + authority + "&targetUrl=" + targetUrl + "&isReportManager=" + (IsReportManager() ? "true" : "false");
            RelayState.Value = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(relayStateString));
            SAMLRequestHelper helper = new SAMLRequestHelper(new TenantInfo(null, new Uri(idpUrl)), new Uri(GetACSUrl()), GetIssuer());
            helper.IsPostBinding = true;
            helper.IsGZip = !helper.IsPostBinding;
            // Set SAML Response
            SAMLRequest.Value = helper.generateSAMLRequest();
            //Set Form Action
            this.frmSSO.Action = idpUrl;

            if (!helper.IsPostBinding)
            {
                Uri redirectUrl = new Uri(idpUrl
                + "?SAMLRequest=" + HtmlUtility.UrlEncode(SAMLRequest.Value) + "&RelayState=" + HtmlUtility.UrlEncode(RelayState.Value));
                HttpContext.Current.Response.Redirect(redirectUrl.ToString());
            }
            // Add OnLoad Logic so that form will be submitted.
            HtmlGenericControl body = (HtmlGenericControl)this.Page.FindControl("bodySSO");
            if (body != null)
            {
                body.Attributes.Add("onload", "document.forms.frmSSO.submit();");
            }
        }
    }
}
