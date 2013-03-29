using System;
using System.Collections.Generic;
using System.Xml;
using System.Text;

namespace TestSAMLUtils
{
    public class XmlUtil
    {
        public static string NormalizeEmptyString(string s)
        {
            if (!string.IsNullOrEmpty(s))
            {
                return s;
            }
            return null;
        }

        public static XmlQualifiedName GetXsiType(XmlReader reader)
        {
            string attribute = reader.GetAttribute("type", "http://www.w3.org/2001/XMLSchema-instance");
            reader.MoveToElement();
            if (string.IsNullOrEmpty(attribute))
            {
                return null;
            }
            return ResolveQName(reader, attribute);
        }

        public static XmlQualifiedName ResolveQName(XmlReader reader, string qstring)
        {
            string name = qstring;
            string prefix = string.Empty;
            int index = qstring.IndexOf(':');
            if (index > -1)
            {
                prefix = qstring.Substring(0, index);
                name = qstring.Substring(index + 1, qstring.Length - (index + 1));
            }
            return new XmlQualifiedName(name, reader.LookupNamespace(prefix));
        }

        public static void ValidateXsiType(XmlReader reader, string expectedTypeName, string expectedTypeNamespace)
        {
            ValidateXsiType(reader, expectedTypeName, expectedTypeNamespace, false);
        }

        public static void ValidateXsiType(XmlReader reader, string expectedTypeName, string expectedTypeNamespace, bool requireDeclaration)
        {
            XmlQualifiedName xsiType = GetXsiType(reader);
            if (null == xsiType)
            {
                if (requireDeclaration)
                {
                    throw DiagnosticUtility.ExceptionUtility.ThrowHelperXml(reader, SR.GetString("ID4104", new object[] { reader.LocalName, reader.NamespaceURI }));
                }
            }
            else if (!StringComparer.Ordinal.Equals(expectedTypeNamespace, xsiType.Namespace) || !StringComparer.Ordinal.Equals(expectedTypeName, xsiType.Name))
            {
                throw DiagnosticUtility.ExceptionUtility.ThrowHelperXml(reader, SR.GetString("ID4102", new object[] { expectedTypeName, expectedTypeNamespace, xsiType.Name, xsiType.Namespace }));
            }
        }

 

 

    }
}
