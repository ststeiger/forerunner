using System;
using System.Security.Principal;
using System.Text;
using System.Web;
using ForeRunner.Reporting.Extensions.SAMLUtils;
using Microsoft.ReportingServices.Interfaces;

namespace ForeRunner.Reporting.Extensions.SAML
{
    /// <summary>
    /// This is the SAML Extension class
    /// </summary>
    public class SAMLAuthenticationExtension : IAuthenticationExtension
    {
        public string LocalizedName
        {
            get
            {
                //TODO:  Replace this with the localized name when we have time.
                return "Forerunner SAML Extension";
            }
        }

        public void SetConfiguration(String configuration)
        {
            //TODO:  Will add this as I go.
        }

        public bool LogonUser(string userName, string password, string authority)
        {
            return SAMLHelperBase.VerifySAMLResponse(userName, password, authority);
        }

        public void GetUserInfo(out IIdentity userIdentity, out IntPtr userId)
        {
            // If the current user identity is not null,
            // set the userIdentity parameter to that of the current user 
            if (HttpContext.Current != null
                  && HttpContext.Current.User != null)
            {
                userIdentity = HttpContext.Current.User.Identity;
            }
            else
            // The current user identity is null. This happens when the user attempts an anonymous logon.
            // Although it is ok to return userIdentity as a null reference, it is best to throw an appropriate
            // exception for debugging purposes.
            // To configure for anonymous logon, return a Gener
            {
                System.Diagnostics.Debug.Assert(false, "Warning: userIdentity is null! Modify your code if you wish to support anonymous logon.");
                throw new NullReferenceException("Anonymous logon is not configured. userIdentity should not be null!");
            }

            // initialize a pointer to the current user id to zero
            userId = IntPtr.Zero;
        }

        public bool IsValidPrincipalName(string principalName)
        {
            //TODO:  Figure out how we want to use the authority string
            return SAMLHelperBase.VerifyUserAndAuthority(principalName, null);
        }
    }
}
