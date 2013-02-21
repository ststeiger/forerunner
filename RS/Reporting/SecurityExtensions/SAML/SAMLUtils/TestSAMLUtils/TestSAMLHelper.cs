using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using ForeRunner.Reporting.Extensions.SAMLUtils;

namespace TestSAMLUtils
{
    class TestSAMLHelper : SAMLHelperBase
    {
        public static bool TestValidateUsernameAndAuthority(String userNameExpected, String samlResponse, String authorityExpected)
        {
            return SAMLHelperBase.ValidateUserNameAndAuthority(userNameExpected, samlResponse, authorityExpected);
        }
    }
}
