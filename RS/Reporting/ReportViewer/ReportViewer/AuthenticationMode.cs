using System;
using System.Web.Configuration;
using System.Configuration;

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
                    instance.loginUrl = sec.Forms.LoginUrl; 
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
