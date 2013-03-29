using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace TestSAMLUtils
{
    public static class ConsentIdentifiers
    {
        // Fields
        public static readonly Uri Explicit = new Uri("urn:oasis:names:tc:SAML:2.0:consent:current-explicit");
        private const string ExplicitString = "urn:oasis:names:tc:SAML:2.0:consent:current-explicit";
        public static readonly Uri Implicit = new Uri("urn:oasis:names:tc:SAML:2.0:consent:current-implicit");
        private const string ImplicitString = "urn:oasis:names:tc:SAML:2.0:consent:current-implicit";
        public static readonly Uri Inapplicable = new Uri("urn:oasis:names:tc:SAML:2.0:consent:inapplicable");
        private const string InapplicableString = "urn:oasis:names:tc:SAML:2.0:consent:inapplicable";
        public static readonly Uri Obtained = new Uri("urn:oasis:names:tc:SAML:2.0:consent:obtained");
        private const string ObtainedString = "urn:oasis:names:tc:SAML:2.0:consent:obtained";
        public static readonly Uri Prior = new Uri("urn:oasis:names:tc:SAML:2.0:consent:prior");
        private const string PriorString = "urn:oasis:names:tc:SAML:2.0:consent:prior";
        public static readonly Uri Unavailable = new Uri("urn:oasis:names:tc:SAML:2.0:consent:unavailable");
        private const string UnavailableString = "urn:oasis:names:tc:SAML:2.0:consent:unavailable";
        public static readonly Uri Unspecified = new Uri("urn:oasis:names:tc:SAML:2.0:consent:unspecified");
        private const string UnspecifiedString = "urn:oasis:names:tc:SAML:2.0:consent:unspecified";
    }
}
