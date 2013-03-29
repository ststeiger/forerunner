using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Common.Web;

namespace TestSAMLUtils
{
    internal static class UriUtil
    {
        // Methods
        public static bool CanCreateValidUri(string uriString, UriKind uriKind)
        {
            Uri uri;
            return TryCreateValidUri(uriString, uriKind, out uri);
        }

        public static string JSEncode(string originalValue)
        {
            if (string.IsNullOrEmpty(originalValue))
            {
                return string.Empty;
            }
            return HtmlUtility.UrlEncode(originalValue).Replace("+", "%20").Replace("'", "%27");
        }

        public static string SafeUrlDecode(string encoded)
        {
            if (!string.IsNullOrEmpty(encoded))
            {
                return HtmlUtility.UrlDecode(encoded);
            }
            return string.Empty;
        }

        public static string SafeUrlEncode(string original)
        {
            if (!string.IsNullOrEmpty(original))
            {
                return HtmlUtility.UrlEncode(original);
            }
            return string.Empty;
        }

        public static bool TryCreateValidUri(string uriString, UriKind uriKind, out Uri result)
        {
            return Uri.TryCreate(uriString, uriKind, out result);
        }
    }
}
