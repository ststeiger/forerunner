using System;
using System.Collections.Generic;
using System.Web;
using System.Web.Security;

namespace Forerunner.Security
{
    public class FormsAuthenticationHelper
    {
        static private HttpCookie FindAuthCookie()
        {
            return HttpContext.Current.Request.Cookies[FormsAuthentication.FormsCookieName];
        }

        static public bool Login(string userNameAndDomain, string password, int timeout)
        {
            
            HttpCookie authCookie = FindAuthCookie();
            if (authCookie == null)
            {
                IntPtr token = IntPtr.Zero;
                const int LOGON32_LOGON_NETWORK = 3;
                const int LOGON32_PROVIDER_DEFAULT = 0;

                string userName;
                string domain = "";
                string[] results = userNameAndDomain.Split('\\');
                if (results.Length > 1)
                {
                    domain = results[0];
                    userName = results[1];
                }
                else
                {
                    userName = results[0];
                }

                try
                {
                    if (Forerunner.Security.NativeMethods.LogonUser(
                        userName,
                        domain,
                        password,
                        LOGON32_LOGON_NETWORK,
                        LOGON32_PROVIDER_DEFAULT, ref token))
                    {
                        // Write the cookie
                        //FormsAuthentication.SetAuthCookie(model.UserName, false);

                        FormsAuthenticationTicket ticket = new FormsAuthenticationTicket(
                            1,
                            userNameAndDomain,
                            DateTime.Now,
                            DateTime.Now.AddMinutes(timeout),
                            false,
                            password,
                            FormsAuthentication.FormsCookiePath);

                        // Encrypt the ticket.
                        string encTicket = FormsAuthentication.Encrypt(ticket);// Create the cookie.
                        HttpContext.Current.Response.Cookies.Add(new HttpCookie(FormsAuthentication.FormsCookieName, encTicket));
                        return true;
                    }
                }
                finally
                {
                    if (token != IntPtr.Zero)
                    {
                        Forerunner.Security.NativeMethods.CloseHandle(token);
                    }
                }
            }

            return false;
        }
    }
}
