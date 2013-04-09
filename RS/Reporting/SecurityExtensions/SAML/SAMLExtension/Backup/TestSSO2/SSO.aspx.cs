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
using TestSSO2;

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
            string targetUrl =@"http://google.com/Tenant1/";
            string authority = SAMLHelperBase.GetAuthorityFromUrl(targetUrl);
            string idpUrl = SAMLHelperBase.GetIDPUrl(authority);
            // Set Relay State
            // TODO:  Need to encrypt this thing before sending this off.
            // Obviously, all these stuff need to be read from the config too.
            // Need to get the tenant information based on the UrlReferrer.
            RelayState.Value = //HtmlUtility.UrlEncode(
                Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(targetUrl));
            SAMLRequestHelper helper = new SAMLRequestHelper(new TenantInfo(null, new Uri(idpUrl)), new Uri(GetACSUrl()), GetIssuer());
            helper.IsGZip = false;
            helper.IsPostBinding = true;
            // Set SAML Response
            //string samlRequest =
            //@"<samlp:AuthnRequest xmlns:samlp=""urn:oasis:names:tc:SAML:2.0:protocol"" xmlns:saml=""urn:oasis:names:tc:SAML:2.0:assertion"" ID=""_ca6fb75447b813cab79686496998a4202509d2aee8"" Version=""2.0"" IssueInstant=""2013-03-06T17:38:31Z"" Destination=""https://halberd.contrivance.org/adfs/ls/auth/integrated/"" AssertionConsumerServiceURL=""https://dragonbeard.contrivance.org/ReportServer/ACS.ashx"""
            //+ @"ProtocolBinding=""urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"">" + 
            //@"<samlp:NameIDPolicy Format=""urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified"" AllowCreate=""true""/>" +
            //@"</samlp:AuthnRequest>"; 
            WIFHelper wifHelper = new WIFHelper();
            wifHelper.setRequestProperties(new Uri(GetACSUrl()), "ForeRunner", GetIssuer());
            byte[] bytes = System.Text.Encoding.UTF8.GetBytes(wifHelper.getSAMLRequest());
            SAMLRequest.Value =
            //    System.Convert.ToBase64String(bytes);
                //wifHelper.getSAMLRequest();
                //samlRequest;
                helper.generateSAMLRequest();
            //Set Form Action
            this.frmSSO.Action = idpUrl;

            if (!helper.IsPostBinding)
            {
                Uri redirectUrl = new Uri(idpUrl
                + "?SAMLRequest=" + HtmlUtility.UrlEncode(SAMLRequest.Value) + "&RelayState=" + HtmlUtility.UrlEncode(RelayState.Value));
                HttpContext.Current.Response.Redirect(redirectUrl.ToString());
                    //idpUrl + "?SAMLRequest=" + HtmlUtility.UrlEncode(SAMLRequest.Value) + "&RelayState=" + HtmlUtility.UrlEncode(RelayState.Value));
            }
            // Add OnLoad Logic so that form will be submitted.
            HtmlGenericControl body = (HtmlGenericControl)this.Page.FindControl("bodySSO");
            if (body != null) {
                body.Attributes.Add("onload", "document.forms.frmSSO.submit();");
            }
        }
    }
}
