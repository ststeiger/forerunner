using System;
using System.Web.Configuration;
using System.Configuration;
using System.Web;

namespace Forerunner.Security
{
    public class AuthenticationMode
    {
        static private bool isInit = false;
        System.Web.Configuration.AuthenticationMode mode;
        string loginUrl = "";
        static private AuthenticationMode instance = new AuthenticationMode();

        static private void Init()
        {
            lock (instance)
            {
                if (!isInit)
                {
                    AuthenticationSection sec = (AuthenticationSection)ConfigurationManager.GetSection("system.web/authentication");
                    instance.mode = sec.Mode;
                    if (instance.mode == System.Web.Configuration.AuthenticationMode.Forms)
                    {
                        string baseUrl = HttpContext.Current.Request.Url.Scheme + "://" + HttpContext.Current.Request.Url.Authority + HttpContext.Current.Request.ApplicationPath.TrimEnd('/') + "/";

                        instance.loginUrl = baseUrl + sec.Forms.LoginUrl.Replace("~", "");
                    }
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

            return instance.mode;
        }

        static public string GetLoginUrl()
        {
            if (!isInit)
            {
                Init();
            }
            return instance.loginUrl;
        }
    }
}
