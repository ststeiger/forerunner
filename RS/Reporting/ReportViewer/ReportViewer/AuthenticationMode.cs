using System;
using System.Web.Configuration;
using System.Configuration;
using System.Web;

namespace Forerunner.Security
{
    public class AuthenticationMode
    {
        static private bool isInit = false;
        static private AuthenticationMode instance = new AuthenticationMode();
        static private AuthenticationSection sec;

        static private void Init()
        {
            lock (instance)
            {
                if (!isInit)
                {
                    sec = (AuthenticationSection)ConfigurationManager.GetSection("system.web/authentication");

                    isInit = true;
                }
            }
        }
        static public System.Web.Configuration.AuthenticationMode GetAuthenticationMode()
        {
            if (!isInit)
            {
                Init();
            }

            return sec.Mode;
        }


        static public string GetLoginUrl()
        {
            if (!isInit)
            {
                Init();
            }
            if (sec.Mode == System.Web.Configuration.AuthenticationMode.Forms)
            {
                if (sec.Forms.LoginUrl.IndexOf("~") >= 0)
                {
                    string baseUrl = HttpContext.Current.Request.Url.Scheme + "://" + HttpContext.Current.Request.Url.Authority + HttpContext.Current.Request.ApplicationPath.TrimEnd('/') + "/";
                    return sec.Forms.LoginUrl.Replace("~", baseUrl);
                }
                else
                    return sec.Forms.LoginUrl;
            }
            return null;
        }
    }
}
