using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace TestSAMLUtils
{
    internal static class NameIdentifierFormats
    {
        // Fields
        public static readonly Uri EmailAddress = new Uri("urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress");
        private const string EmailAddressString = "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress";
        public static readonly Uri Encrypted = new Uri("urn:oasis:names:tc:SAML:2.0:nameid-format:encrypted");
        private const string EncryptedString = "urn:oasis:names:tc:SAML:2.0:nameid-format:encrypted";
        public static readonly Uri Entity = new Uri("urn:oasis:names:tc:SAML:2.0:nameid-format:entity");
        private const string EntityString = "urn:oasis:names:tc:SAML:2.0:nameid-format:entity";
        public static readonly Uri Kerberos = new Uri("urn:oasis:names:tc:SAML:2.0:nameid-format:kerberos");
        private const string KerberosString = "urn:oasis:names:tc:SAML:2.0:nameid-format:kerberos";
        public static readonly Uri Persistent = new Uri("urn:oasis:names:tc:SAML:2.0:nameid-format:persistent");
        private const string PersistentString = "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent";
        public static readonly Uri Transient = new Uri("urn:oasis:names:tc:SAML:2.0:nameid-format:transient");
        private const string TransientString = "urn:oasis:names:tc:SAML:2.0:nameid-format:transient";
        public static readonly Uri Unspecified = new Uri("urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified");
        private const string UnspecifiedString = "urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified";
        public static readonly Uri WindowsDomainQualifiedName = new Uri("urn:oasis:names:tc:SAML:1.1:nameid-format:WindowsDomainQualifiedName");
        private const string WindowsDomainQualifiedNameString = "urn:oasis:names:tc:SAML:1.1:nameid-format:WindowsDomainQualifiedName";
        public static readonly Uri X509SubjectName = new Uri("urn:oasis:names:tc:SAML:1.1:nameid-format:X509SubjectName");
        private const string X509SubjectNameString = "urn:oasis:names:tc:SAML:1.1:nameid-format:X509SubjectName";
    }
}
