using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CustomLoginProvider
{
    public class SampleLoginProvider : Forerunner.Security.ICustomLoginProvider
    {
        private Dictionary<string, string> credentials = new Dictionary<string, string>();
        public SampleLoginProvider()
        {
            credentials[@"TestDomain\userName1"] = "password1";
            credentials[@"TestDomain\userName2"] = "password2";
        }
        public bool Login(string userName, string domain, string password)
        {
            if (credentials.ContainsKey(domain + @"\" + userName)) {
                return true;
            }

            return false;
        }
    }
}
