using System;
using System.Collections.Generic;
using System.Web;
using System.Web.Security;
using System.Net;
using System.Reflection;
using System.Configuration;
using Forerunner.SSRS.Viewer;
using Forerunner;
using Forerunner.Logging;

namespace Forerunner.Security
{
    public interface ICustomLoginProvider
    {
        bool Login(string userName, string domain, string password);
    }

    public class FormsAuthenticationHelper
    {
        static Assembly loginProviderAssembly = null;
        static private string url = ConfigurationManager.AppSettings["Forerunner.ReportServerWSUrl"];
        static private int ReportServerTimeout = ForerunnerUtil.GetAppSetting("Forerunner.ReportServerTimeout", 100000);
        static private Forerunner.Config.WebConfigSection webConfigSection = Forerunner.Config.WebConfigSection.GetConfigSection();
        static private string loginProvider = ConfigurationManager.AppSettings["Forerunner.LoginProvider"];
        static private string loginProviderAssemblyPath = ConfigurationManager.AppSettings["Forerunner.LoginProviderAssemblyPath"];

        static FormsAuthenticationHelper()
        {
            if (loginProvider != null && loginProviderAssemblyPath != null)
                loginProviderAssembly = Assembly.LoadFile(loginProviderAssemblyPath);
        }
        static private HttpCookie FindAuthCookie()
        {
            return HttpContext.Current.Request.Cookies[FormsAuthentication.FormsCookieName];
        }

        static private string GetFirstUrl()
        {
            if (url != null)
                return url;

            if (webConfigSection != null)
            {
                Forerunner.Config.ConfigElementCollection configElementCollection = webConfigSection.InstanceCollection;
                foreach (Forerunner.Config.ConfigElement configElement in configElementCollection)
                {
                    if (configElement.ReportServerWSUrl != null)
                        return configElement.ReportServerWSUrl;
                }
            }
            return "";
        }

        static private bool CustomLogin(string userName, string domain, string password)
        {
            if (loginProvider == null)
                return false;

            try
            {
                Type type = loginProviderAssembly.GetType(loginProvider);
                ICustomLoginProvider provider = (ICustomLoginProvider)Activator.CreateInstance(type);
                return provider.Login(userName, domain, password);
            }
            catch(Exception e)
            {
                Logger.Trace(LogType.Error, "CustomLogin module failed " + e.ToString());
            }
            return false;
        }

        static public ICredentials GetCredentials()
        {
            if (AuthenticationMode.GetAuthenticationMode() == System.Web.Configuration.AuthenticationMode.Windows || loginProviderAssembly != null)
            {
                return CredentialCache.DefaultNetworkCredentials;
            }


            HttpCookie authCookie = HttpContext.Current.Request.Cookies[FormsAuthentication.FormsCookieName];
            FormsAuthenticationTicket authTicket = FormsAuthentication.Decrypt(authCookie.Value);

            return new NetworkCredential(authTicket.Name, authTicket.UserData);
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
                    bool authenticated = loginProvider == null? Forerunner.Security.NativeMethods.LogonUser(
                        userName,
                        domain,
                        password,
                        LOGON32_LOGON_NETWORK,
                        LOGON32_PROVIDER_DEFAULT, ref token) : CustomLogin(userName, domain, password);

                    // This is the code path when we cannot authenticate with the Web Server.
                    // Have to make a call to RS.
                    if (!authenticated)
                    {
                        Logger.Trace(LogType.Info, "Failure to login localy, trying RS login validation");
                        Logger.Trace(LogType.Info, "RS URL:" + GetFirstUrl() + " UserName:"+ userName +  " Domain:" + domain);
                        try
                        {
                            NetworkCredential networkCredential = new NetworkCredential(userName, password, domain);
                            ReportViewer reportViewer = new ReportViewer(GetFirstUrl(), ReportServerTimeout);
                            reportViewer.SetCredentials(networkCredential);
                            reportViewer.VaidateServerConnection();
                            authenticated = true;
                        }
                        catch (Exception e)
                        {
                            Logger.Trace(LogType.Error, e.Message);
                            authenticated = false;
                        }
                    }

                    if (authenticated)
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
