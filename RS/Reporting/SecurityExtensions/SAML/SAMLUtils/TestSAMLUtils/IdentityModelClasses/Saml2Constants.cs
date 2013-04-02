using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace TestSAMLUtils
{
    public static class Saml2Constants
    {
        // Fields
        public const string Namespace = "urn:oasis:names:tc:SAML:2.0:assertion";
        public const string Prefix = "saml";

        // Nested Types
        public static class ActionNamespaces
        {
            // Fields
            public static readonly Uri Ghpp = new Uri("urn:oasis:names:tc:SAML:1.0:action:ghpp");
            private const string GhppString = "urn:oasis:names:tc:SAML:1.0:action:ghpp";
            public static readonly Uri Rwedc = new Uri("urn:oasis:names:tc:SAML:1.0:action:rwedc");
            public static readonly Uri RwedcNegation = new Uri("urn:oasis:names:tc:SAML:1.0:action:rwedc-negation");
            private const string RwedcNegationString = "urn:oasis:names:tc:SAML:1.0:action:rwedc-negation";
            private const string RwedcString = "urn:oasis:names:tc:SAML:1.0:action:rwedc";
            public static readonly Uri Unix = new Uri("urn:oasis:names:tc:SAML:1.0:action:unix");
            private const string UnixString = "urn:oasis:names:tc:SAML:1.0:action:unix";
        }

        public static class Attributes
        {
            // Fields
            public const string Address = "Address";
            public const string AuthnInstant = "AuthnInstant";
            public const string Count = "Count";
            public const string Decision = "Decision";
            public const string DNSName = "DNSName";
            public const string Format = "Format";
            public const string FriendlyName = "FriendlyName";
            public const string ID = "ID";
            public const string InResponseTo = "InResponseTo";
            public const string IssueInstant = "IssueInstant";
            public const string Method = "Method";
            public const string Name = "Name";
            public const string NameFormat = "NameFormat";
            public const string NameQualifier = "NameQualifier";
            public const string Namespace = "Namespace";
            public const string NotBefore = "NotBefore";
            public const string NotOnOrAfter = "NotOnOrAfter";
            public const string OriginalIssuer = "OriginalIssuer";
            public const string Recipient = "Recipient";
            public const string Resource = "Resource";
            public const string SessionIndex = "SessionIndex";
            public const string SessionNotOnOrAfter = "SessionNotOnOrAfter";
            public const string SPNameQualifier = "SPNameQualifier";
            public const string SPProvidedID = "SPProvidedID";
            public const string Version = "Version";
        }

        public static class AuthenticationContextClasses
        {
            // Fields
            public static readonly Uri AuthenticatedTelephony = new Uri("urn:oasis:names:tc:SAML:2.0:ac:classes:AuthenticatedTelephony");
            internal const string AuthenticatedTelephonyString = "urn:oasis:names:tc:SAML:2.0:ac:classes:AuthenticatedTelephony";
            public static readonly Uri InternetProtocol = new Uri("urn:oasis:names:tc:SAML:2.0:ac:classes:InternetProtocol");
            public static readonly Uri InternetProtocolPassword = new Uri("urn:oasis:names:tc:SAML:2.0:ac:classes:InternetProtocolPassword");
            internal const string InternetProtocolPasswordString = "urn:oasis:names:tc:SAML:2.0:ac:classes:InternetProtocolPassword";
            internal const string InternetProtocolString = "urn:oasis:names:tc:SAML:2.0:ac:classes:InternetProtocol";
            public static readonly Uri Kerberos = new Uri("urn:oasis:names:tc:SAML:2.0:ac:classes:Kerberos");
            internal const string KerberosString = "urn:oasis:names:tc:SAML:2.0:ac:classes:Kerberos";
            public static readonly Uri MobileOneFactorContract = new Uri("urn:oasis:names:tc:SAML:2.0:ac:classes:MobileOneFactorContract");
            internal const string MobileOneFactorContractString = "urn:oasis:names:tc:SAML:2.0:ac:classes:MobileOneFactorContract";
            public static readonly Uri MobileOneFactorUnregistered = new Uri("urn:oasis:names:tc:SAML:2.0:ac:classes:MobileOneFactorUnregistered");
            internal const string MobileOneFactorUnregisteredString = "urn:oasis:names:tc:SAML:2.0:ac:classes:MobileOneFactorUnregistered";
            public static readonly Uri MobileTwoFactorContract = new Uri("urn:oasis:names:tc:SAML:2.0:ac:classes:MobileTwoFactorContract");
            internal const string MobileTwoFactorContractString = "urn:oasis:names:tc:SAML:2.0:ac:classes:MobileTwoFactorContract";
            public static readonly Uri MobileTwoFactorUnregistered = new Uri("urn:oasis:names:tc:SAML:2.0:ac:classes:MobileTwoFactorUnregistered");
            internal const string MobileTwoFactorUnregisteredString = "urn:oasis:names:tc:SAML:2.0:ac:classes:MobileTwoFactorUnregistered";
            public static readonly Uri NomadTelephony = new Uri("urn:oasis:names:tc:SAML:2.0:ac:classes:NomadTelephony");
            internal const string NomadTelephonyString = "urn:oasis:names:tc:SAML:2.0:ac:classes:NomadTelephony";
            public static readonly Uri Password = new Uri("urn:oasis:names:tc:SAML:2.0:ac:classes:Password");
            public static readonly Uri PasswordProtectedTransport = new Uri("urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport");
            internal const string PasswordProtectedTransportString = "urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport";
            internal const string PasswordString = "urn:oasis:names:tc:SAML:2.0:ac:classes:Password";
            public static readonly Uri PersonalTelephony = new Uri("urn:oasis:names:tc:SAML:2.0:ac:classes:PersonalTelephony");
            internal const string PersonalTelephonyString = "urn:oasis:names:tc:SAML:2.0:ac:classes:PersonalTelephony";
            public static readonly Uri Pgp = new Uri("urn:oasis:names:tc:SAML:2.0:ac:classes:PGP");
            internal const string PgpString = "urn:oasis:names:tc:SAML:2.0:ac:classes:PGP";
            public static readonly Uri PreviousSession = new Uri("urn:oasis:names:tc:SAML:2.0:ac:classes:PreviousSession");
            internal const string PreviousSessionString = "urn:oasis:names:tc:SAML:2.0:ac:classes:PreviousSession";
            public static readonly Uri SecureRemotePassword = new Uri("urn:oasis:names:tc:SAML:2.0:ac:classes:SecureRemotePassword");
            internal const string SecureRemotePasswordString = "urn:oasis:names:tc:SAML:2.0:ac:classes:SecureRemotePassword";
            internal const string SecureRempotePasswordString = "urn:oasis:names:tc:SAML:2.0:ac:classes:SecureRemotePassword";
            public static readonly Uri Smartcard = new Uri("urn:oasis:names:tc:SAML:2.0:ac:classes:Smartcard");
            public static readonly Uri SmartcardPki = new Uri("urn:oasis:names:tc:SAML:2.0:ac:classes:SmartcardPKI");
            internal const string SmartcardPkiString = "urn:oasis:names:tc:SAML:2.0:ac:classes:SmartcardPKI";
            internal const string SmartcardString = "urn:oasis:names:tc:SAML:2.0:ac:classes:Smartcard";
            public static readonly Uri SoftwarePki = new Uri("urn:oasis:names:tc:SAML:2.0:ac:classes:SoftwarePKI");
            internal const string SoftwarePkiString = "urn:oasis:names:tc:SAML:2.0:ac:classes:SoftwarePKI";
            public static readonly Uri Spki = new Uri("urn:oasis:names:tc:SAML:2.0:ac:classes:SPKI");
            internal const string SpkiString = "urn:oasis:names:tc:SAML:2.0:ac:classes:SPKI";
            public static readonly Uri Telephony = new Uri("urn:oasis:names:tc:SAML:2.0:ac:classes:Telephony");
            internal const string TelephonyString = "urn:oasis:names:tc:SAML:2.0:ac:classes:Telephony";
            public static readonly Uri TimeSyncToken = new Uri("urn:oasis:names:tc:SAML:2.0:ac:classes:TimeSyncToken");
            internal const string TimeSyncTokenString = "urn:oasis:names:tc:SAML:2.0:ac:classes:TimeSyncToken";
            public static readonly Uri TlsClient = new Uri("urn:oasis:names:tc:SAML:2.0:ac:classes:TLSClient");
            internal const string TlsClientString = "urn:oasis:names:tc:SAML:2.0:ac:classes:TLSClient";
            public static readonly Uri Unspecified = new Uri("urn:oasis:names:tc:SAML:2.0:ac:classes:Unspecified");
            internal const string UnspecifiedString = "urn:oasis:names:tc:SAML:2.0:ac:classes:Unspecified";
            internal const string WindowsString = "urn:federation:authentication:windows";
            public static readonly Uri X509 = new Uri("urn:oasis:names:tc:SAML:2.0:ac:classes:X509");
            internal const string X509String = "urn:oasis:names:tc:SAML:2.0:ac:classes:X509";
            public static readonly Uri XmlDSig = new Uri("urn:oasis:names:tc:SAML:2.0:ac:classes:XMLDSig");
            internal const string XmlDsigString = "urn:oasis:names:tc:SAML:2.0:ac:classes:XMLDSig";
        }

        public static class ConfirmationMethods
        {
            // Fields
            public static readonly Uri Bearer = new Uri("urn:oasis:names:tc:SAML:2.0:cm:bearer");
            private const string BearerString = "urn:oasis:names:tc:SAML:2.0:cm:bearer";
            public static readonly Uri HolderOfKey = new Uri("urn:oasis:names:tc:SAML:2.0:cm:holder-of-key");
            private const string HolderOfKeyString = "urn:oasis:names:tc:SAML:2.0:cm:holder-of-key";
            public static readonly Uri SenderVouches = new Uri("urn:oasis:names:tc:SAML:2.0:cm:sender-vouches");
            private const string SenderVouchesString = "urn:oasis:names:tc:SAML:2.0:cm:sender-vouches";
        }

        public static class Elements
        {
            // Fields
            public const string Action = "Action";
            public const string Advice = "Advice";
            public const string Assertion = "Assertion";
            public const string AssertionIDRef = "AssertionIDRef";
            public const string AssertionURIRef = "AssertionURIRef";
            public const string Attribute = "Attribute";
            public const string AttributeStatement = "AttributeStatement";
            public const string AttributeValue = "AttributeValue";
            public const string Audience = "Audience";
            public const string AudienceRestriction = "AudienceRestriction";
            public const string AuthenticatingAuthority = "AuthenticatingAuthority";
            public const string AuthnContext = "AuthnContext";
            public const string AuthnContextClassRef = "AuthnContextClassRef";
            public const string AuthnContextDecl = "AuthnContextDecl";
            public const string AuthnContextDeclRef = "AuthnContextDeclRef";
            public const string AuthnStatement = "AuthnStatement";
            public const string AuthzDecisionStatement = "AuthzDecisionStatement";
            public const string BaseID = "BaseID";
            public const string Condition = "Condition";
            public const string Conditions = "Conditions";
            public const string EncryptedAssertion = "EncryptedAssertion";
            public const string EncryptedAttribute = "EncryptedAttribute";
            public const string EncryptedID = "EncryptedID";
            public const string Evidence = "Evidence";
            public const string Issuer = "Issuer";
            public const string NameID = "NameID";
            public const string OneTimeUse = "OneTimeUse";
            public const string ProxyRestricton = "ProxyRestriction";
            public const string Statement = "Statement";
            public const string Subject = "Subject";
            public const string SubjectConfirmation = "SubjectConfirmation";
            public const string SubjectConfirmationData = "SubjectConfirmationData";
            public const string SubjectLocality = "SubjectLocality";
        }

        public static class NameIdentifierFormats
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

        public static class Types
        {
            // Fields
            public const string ActionType = "ActionType";
            public const string AdviceType = "AdviceType";
            public const string AssertionType = "AssertionType";
            public const string AttributeStatementType = "AttributeStatementType";
            public const string AttributeType = "AttributeType";
            public const string AudienceRestrictionType = "AudienceRestrictionType";
            public const string AuthnContextType = "AuthnContextType";
            public const string AuthnStatementType = "AuthnStatementType";
            public const string AuthzDecisionStatementType = "AuthzDecisionStatementType";
            public const string BaseIDAbstractType = "BaseIDAbstractType";
            public const string ConditionAbstractType = "ConditionAbstractType";
            public const string ConditionsType = "ConditionsType";
            public const string EncryptedElementType = "EncryptedElementType";
            public const string EvidenceType = "EvidenceType";
            public const string KeyInfoConfirmationDataType = "KeyInfoConfirmationDataType";
            public const string NameIDType = "NameIDType";
            public const string OneTimeUseType = "OneTimeUseType";
            public const string ProxyRestrictionType = "ProxyRestrictionType";
            public const string StatementAbstractType = "StatementAbstractType";
            public const string SubjectConfirmationDataType = "SubjectConfirmationDataType";
            public const string SubjectConfirmationType = "SubjectConfirmationType";
            public const string SubjectLocalityType = "SubjectLocalityType";
            public const string SubjectType = "SubjectType";
        }
    }
}
