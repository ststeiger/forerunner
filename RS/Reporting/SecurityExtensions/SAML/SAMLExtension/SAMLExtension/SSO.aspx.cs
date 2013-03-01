using System;
using System.Collections.Generic;
using System.Configuration;
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

        protected void Page_Load(object sender, EventArgs e) {
            string targetUrl = HttpContext.Current.Request.UrlReferrer.ToString();
            string authority = SAMLHelperBase.GetAuthorityFromUrl(targetUrl);
            string idpUrl = SAMLHelperBase.GetIDPUrl(authority);
            // Set Relay State
            // TODO:  Need to encrypt this thing before sending this off.
            // Obviously, all these stuff need to be read from the config too.
            // Need to get the tenant information based on the UrlReferrer.
            RelayState.Value = HtmlUtility.UrlEncode(Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(targetUrl)));
            SAMLRequestHelper helper = new SAMLRequestHelper(new TenantInfo(null, new Uri(idpUrl)), new Uri(GetACSUrl()), GetIssuer());
            // Set SAML Response
            SAMLResponse.Value = HtmlUtility.UrlEncode(helper.generateSAMLRequest());
            //Set Form Action
            this.frmSSO.Action = idpUrl;
            
            // Add OnLoad Logic so that form will be submitted.
            HtmlGenericControl body = (HtmlGenericControl)this.Page.FindControl("bodySSO");
            if (body != null) {
                body.Attributes.Add("onload", "document.forms.frmSSO.submit();");
            }
        }
    }
}
