using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Security.Cryptography.X509Certificates;
using System.Web.UI.HtmlControls;
using ForeRunner.Reporting.Extensions.SAMLUtils;

namespace ForeRunner.Reporting.Extensions.SAML
{
    public partial class SSO : System.Web.UI.Page {
        protected void Page_Load(object sender, EventArgs e) {
            // Set Relay State
            // TODO:  Need to encrypt this thing before sending this off.
            // Obviously, all these stuff need to be read from the config too.
            // Need to get the tenant information based on the UrlReferrer.
            RelayState.Value = HttpContext.Current.Request.UrlReferrer.ToString();
            SAMLRequestHelper helper = new SAMLRequestHelper(new TenantInfo(null, new Uri("http://idp.com/SSO.asmx")), new Uri("http://myservice.com/ACS.ashx"), "TestIssuer");
            // Set SAML Response
            SAMLResponse.Value =
                helper.generateSAMLRequest();

            //Set Form Action
            this.frmSSO.Action = "http://idp.com/SSO.asmx";
            
            // Add OnLoad Logic so that form will be submitted.
            HtmlGenericControl body = (HtmlGenericControl)this.Page.FindControl("bodySSO");
            if (body != null) {
                body.Attributes.Add("onload", "document.forms.frmSSO.submit();");
            }
        }
    }
}
