using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace TestSAMLUtils
{
    public class SamlpUtil
    {
        public static string EmptyToNull(string s)
        {
            if (!string.IsNullOrEmpty(s))
            {
                return s;
            }
            return null;
        }
    }
}
