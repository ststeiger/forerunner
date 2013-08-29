using System;
using System.Web.Configuration;
using System.Configuration;

namespace Forerunner.Security
{
    public class AuthenticationMode
    {
        static private bool isInit = false;
        System.Web.Configuration.AuthenticationMode mode;
        static private AuthenticationMode instance = new AuthenticationMode();

        static public System.Web.Configuration.AuthenticationMode GetAuthenticationMode()
        {
            if (!isInit)
            {
                lock (instance)
                {  
                    AuthenticationSection sec = (AuthenticationSection)ConfigurationManager.GetSection("system.web/authentication");
                    instance.mode = sec.Mode;
                    isInit = true;
                }

            }

            return instance.mode;
        }
    }
}
