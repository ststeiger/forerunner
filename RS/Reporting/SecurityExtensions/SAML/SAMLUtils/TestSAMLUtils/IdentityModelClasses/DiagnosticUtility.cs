using System;
using System.Collections.Generic;
using System.Xml;
using System.Text;

namespace TestSAMLUtils
{
    internal class DiagnosticUtility
    {
        static public ExceptionUtility2 ExceptionUtility = new ExceptionUtility2();
        internal class ExceptionUtility2
        {
            public Exception ThrowHelperError(Exception e)
            {
                return e;
            }

            public Exception ThrowHelperArgument(string s, string s2) 
            {
                return new ArgumentException(s + s2);
            }

            public Exception ThrowHelperArgumentNull(string s)
            {
                return new ArgumentNullException(s);
            }

            public Exception ThrowHelperXml(XmlReader r, string s)
            {
                return new ArgumentException(s);
            }
        }
    }
}
