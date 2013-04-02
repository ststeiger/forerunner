using System;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Xml;
using System.Security;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Security.Cryptography.Xml;
using ForeRunner.Reporting.Extensions.SAMLUtils;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace TestSAMLUtils
{
    [TestClass]
    public class SAMLRequestTest
    {
        [TestMethod]
        [DeploymentItem("myCert.cer")]
        public void TestRequest()
        {
            string certString = File.ReadAllText(".\\myCert.cer");
            X509Certificate2 x509 = new X509Certificate2(Encoding.UTF8.GetBytes(certString));

            TenantInfo tenantInfo = new TenantInfo(x509.PublicKey.Key, new Uri(DatabaseAccessTest.testUrl));
            SAMLRequestHelper requestHelper = new SAMLRequestHelper(tenantInfo, new Uri("http://localhost/acs.ashx"), "TestIssuer");
            string samlRequest = requestHelper.generateSAMLRequest();
            byte[] bytes = Convert.FromBase64String(samlRequest);
            Assert.IsFalse(CheckIsCompressed.IsGZip(bytes));
            requestHelper.IsGZip = true;
            samlRequest = requestHelper.generateSAMLRequest();
            byte[] bytesCompressed = Convert.FromBase64String(samlRequest);
            Assert.IsTrue(CheckIsCompressed.IsGZip(bytesCompressed));

            byte[] bytesUncompressed = SAMLHelperBase.inflateIfNeeded(bytesCompressed);
            Assert.AreEqual(bytes.Length, bytesUncompressed.Length);
            for (int i = 0; i < bytes.Length; i++)
                Assert.AreEqual(bytes[i], bytesUncompressed[i]);
        }

        [TestMethod]
        [DeploymentItem("app.config")]
        public void TestGetAuthorityFromUrl()
        {
            string result = SAMLHelperBase.GetAuthorityFromUrl("http://derp.derp.com/Tenant1/derp/blah");
            Assert.AreEqual("Tenant1", result);
            result = SAMLHelperBase.GetAuthorityFromUrl("http://derp.derp.com/");
            Assert.AreEqual("", result);
        }

        [TestMethod]
        [DeploymentItem("myCert.cer")]
        public void TestSAMLRequestDeserialization()
        {
            string certString = File.ReadAllText(".\\myCert.cer");
            X509Certificate2 x509 = new X509Certificate2(Encoding.UTF8.GetBytes(certString));

            TenantInfo tenantInfo = new TenantInfo(x509.PublicKey.Key, new Uri(DatabaseAccessTest.testUrl));
            SAMLRequestHelper requestHelper = new SAMLRequestHelper(tenantInfo, new Uri("http://localhost/acs.ashx"), "TestIssuer");
            string samlRequest = requestHelper.generateSAMLRequest();
            byte[] bytes = Convert.FromBase64String(samlRequest);
            Assert.IsFalse(CheckIsCompressed.IsGZip(bytes));
            string decodedString = Encoding.UTF8.GetString(bytes);

            using (StringReader reader = new StringReader(decodedString))
            {
                using (XmlReader reader2 = XmlReader.Create(reader))
                {
                    XmlNamespaceReader reader3 = new XmlNamespaceReader(reader2);
                    ReadSamlMessage(reader3);
                }
            }

        }

        private SamlMessage ReadSamlMessage(XmlReader reader)
        {
            if (reader == null)
            {
                throw new ArgumentNullException("reader");
            }
            XmlNamespaceReader reader2 = new XmlNamespaceReader(reader);
            return this.ReadSamlMessage(reader2, reader2.NamespaceContext);
        }

        private SamlMessage ReadSamlMessage(XmlReader reader, NamespaceContext context)
        {
            if (reader == null)
            {
                throw new ArgumentNullException("reader");
            }
            
            if (reader.IsStartElement("AuthnRequest", "urn:oasis:names:tc:SAML:2.0:protocol"))
            {
                return this.ReadAuthnRequest(reader);
            }
            throw new Exception("Should not be here!");
        }

        private AuthenticationRequest ReadAuthnRequest(XmlReader reader)
        {
            AuthenticationRequest request2;
            if (reader == null)
            {
                throw new ArgumentNullException("reader");
            }
            try
            {
                AuthenticationRequest data = new AuthenticationRequest();
                //if (this._handleSignature)
                //{
                //    reader = this.CreateEnvelopedSignatureReader(reader, data);
                //}
                if (!reader.IsStartElement("AuthnRequest", "urn:oasis:names:tc:SAML:2.0:protocol"))
                {
                    reader.ReadStartElement("AuthnRequest", "urn:oasis:names:tc:SAML:2.0:protocol");
                }
                bool isEmptyElement = reader.IsEmptyElement;
                XmlUtil.ValidateXsiType(reader, "AuthnRequestType", "urn:oasis:names:tc:SAML:2.0:protocol");
                this.ReadCommonAttributes(reader, data);
                string attribute = reader.GetAttribute("ForceAuthn");
                if (!string.IsNullOrEmpty(attribute))
                {
                    data.ForceAuthentication = XmlConvert.ToBoolean(attribute);
                }
                attribute = reader.GetAttribute("IsPassive");
                if (!string.IsNullOrEmpty(attribute))
                {
                    data.IsPassive = XmlConvert.ToBoolean(attribute);
                }
                attribute = reader.GetAttribute("ProtocolBinding");
                if (!string.IsNullOrEmpty(attribute))
                {
                    data.ProtocolBinding = new Uri(attribute);
                }
                attribute = reader.GetAttribute("AssertionConsumerServiceIndex");
                if (!string.IsNullOrEmpty(attribute))
                {
                    data.AssertionConsumerServiceIndex = new int?(XmlConvert.ToInt32(attribute));
                }
                attribute = reader.GetAttribute("AssertionConsumerServiceURL");
                if (!string.IsNullOrEmpty(attribute))
                {
                    data.AssertionConsumerServiceUrl = new Uri(attribute);
                }
                attribute = reader.GetAttribute("AttributeConsumingServiceIndex");
                if (!string.IsNullOrEmpty(attribute))
                {
                    data.AttributeConsumingServiceIndex = new int?(XmlConvert.ToInt32(attribute));
                }
                attribute = reader.GetAttribute("ProviderName");
                if (!string.IsNullOrEmpty(attribute))
                {
                    data.ProviderName = attribute;
                }
                reader.ReadStartElement();
                if (!isEmptyElement)
                {
                    this.ReadCommonElements(reader, data);
                    //if (reader.IsStartElement("Subject", "urn:oasis:names:tc:SAML:2.0:assertion"))
                    //{
                    //    data.Subject = this._assertionSerializer.ReadSubject(reader);
                    //}
                    if (reader.IsStartElement("NameIDPolicy", "urn:oasis:names:tc:SAML:2.0:protocol"))
                    {
                        data.NameIdentifierPolicy = this.ReadNameIDPolicy(reader);
                    }
                    //if (reader.IsStartElement("Conditions", "urn:oasis:names:tc:SAML:2.0:assertion"))
                    //{
                    //    data.Conditions = this._assertionSerializer.ReadConditions(reader);
                    //}
                    if (reader.IsStartElement("RequestedAuthnContext", "urn:oasis:names:tc:SAML:2.0:protocol"))
                    {
                        data.RequestedAuthenticationContext = this.ReadRequestedAuthnContext(reader);
                    }
                    if (reader.IsStartElement("Scoping", "urn:oasis:names:tc:SAML:2.0:protocol"))
                    {
                        data.Scoping = this.ReadScoping(reader);
                    }
                    reader.ReadEndElement();
                    //if (this._handleSignature)
                    //{
                    //    this.SetSigningCredentials(reader, data);
                    //}
                }
                request2 = data;
            }
            catch (Exception exception)
            {
                throw exception;
            }
            return request2;
        }

        private Saml2NameIdentifier ReadIssuer(XmlReader reader)
        {
            if (reader == null)
            {
                throw DiagnosticUtility.ExceptionUtility.ThrowHelperArgumentNull("reader");
            }
            if (!reader.IsStartElement("Issuer", "urn:oasis:names:tc:SAML:2.0:assertion"))
            {
                reader.ReadStartElement("Issuer", "urn:oasis:names:tc:SAML:2.0:assertion");
            }
            return this.ReadNameIDType(reader);
        }

 


        private void ReadCommonAttributes(XmlReader reader, SamlMessage message)
        {
            if (reader == null)
            {
                throw new ArgumentNullException("reader");
            }
            if (message == null)
            {
                throw new ArgumentNullException("message");
            }
            try
            {
                string attribute = reader.GetAttribute("ID");
                if (string.IsNullOrEmpty(attribute))
                {
                    throw DiagnosticUtility.ExceptionUtility.ThrowHelperXml(reader, SR.GetString("MSIS0006", new object[] { "ID" }));
                }
                message.Id = new Saml2Id(attribute);
                attribute = reader.GetAttribute("Version");
                if (string.IsNullOrEmpty(attribute))
                {
                    throw DiagnosticUtility.ExceptionUtility.ThrowHelperXml(reader, SR.GetString("MSIS0006", new object[] { "Version" }));
                }
                if (!StringComparer.Ordinal.Equals(message.Version, attribute))
                {
                    throw DiagnosticUtility.ExceptionUtility.ThrowHelperXml(reader, SR.GetString("MSIS0007", new object[] { attribute }));
                }
                attribute = reader.GetAttribute("IssueInstant");
                if (string.IsNullOrEmpty(attribute))
                {
                    throw DiagnosticUtility.ExceptionUtility.ThrowHelperXml(reader, SR.GetString("MSIS0006", new object[] { "IssueInstant" }));
                }
                message.IssueInstant = XmlConvert.ToDateTime(attribute, DateTimeFormats.Accepted);
                attribute = reader.GetAttribute("Destination");
                if (!string.IsNullOrEmpty(attribute))
                {
                    message.Destination = new Uri(attribute);
                }
                attribute = reader.GetAttribute("Consent");
                if (!string.IsNullOrEmpty(attribute))
                {
                    message.Consent = new Uri(attribute);
                }
            }
            catch (Exception exception)
            {
                throw exception;
            }
        }

        private void ReadCommonElements(XmlReader reader, SamlMessage message)
        {
            if (reader == null)
            {
                throw new ArgumentNullException("reader");
            }
            if (message == null)
            {
                throw new ArgumentNullException("message");
            }
            try
            {
                if (reader.IsStartElement("Issuer", "urn:oasis:names:tc:SAML:2.0:assertion"))
                {
                    ReadIssuer(reader);
                    //message.Issuer = this._assertionSerializer.ReadIssuer(reader);
                }
                /*
                if (reader.IsStartElement("Signature", "http://www.w3.org/2000/09/xmldsig#"))
                {
                    EnvelopedSignatureReader reader2 = reader as EnvelopedSignatureReader;
                    if (reader2 != null)
                    {
                        reader2.TryReadSignature();
                    }
                    else
                    {
                        reader.Skip();
                    }
                }
                if (reader.IsStartElement("Extensions", "urn:oasis:names:tc:SAML:2.0:protocol"))
                {
                    this.ReadExtensions(reader, message);
                }
                 */
            }
            catch (Exception exception)
            {
                throw exception;
            }
        }





        internal virtual NameIdentifierPolicy ReadNameIDPolicy(XmlReader reader)
        {
            NameIdentifierPolicy policy2;
            if (reader == null)
            {
                throw new ArgumentNullException("reader");
            }
            try
            {
                if (!reader.IsStartElement("NameIDPolicy", "urn:oasis:names:tc:SAML:2.0:protocol"))
                {
                    reader.ReadStartElement("NameIDPolicy", "urn:oasis:names:tc:SAML:2.0:protocol");
                }
                NameIdentifierPolicy policy = new NameIdentifierPolicy();
                bool isEmptyElement = reader.IsEmptyElement;
                XmlUtil.ValidateXsiType(reader, "NameIDPolicyType", "urn:oasis:names:tc:SAML:2.0:protocol");
                string attribute = reader.GetAttribute("Format");
                if (!string.IsNullOrEmpty(attribute))
                {
                    policy.Format = new Uri(attribute);
                }
                attribute = reader.GetAttribute("SPNameQualifier");
                if (!string.IsNullOrEmpty(attribute))
                {
                    policy.SPNameQualifier = attribute;
                }
                attribute = reader.GetAttribute("AllowCreate");
                if (!string.IsNullOrEmpty(attribute))
                {
                    policy.AllowCreate = XmlConvert.ToBoolean(attribute);
                }
                reader.ReadStartElement();
                if (!isEmptyElement)
                {
                    reader.ReadEndElement();
                }
                policy2 = policy;
            }
            catch (Exception exception)
            {
                throw exception;
            }
            return policy2;
        }

        private RequestedAuthenticationContext ReadRequestedAuthnContext(XmlReader reader)
        {
            RequestedAuthenticationContext context2;
            if (reader == null)
            {
                throw new ArgumentNullException("reader");
            }
            try
            {
                if (!reader.IsStartElement("RequestedAuthnContext", "urn:oasis:names:tc:SAML:2.0:protocol"))
                {
                    reader.ReadStartElement("RequestedAuthnContext", "urn:oasis:names:tc:SAML:2.0:protocol");
                }
                if (reader.IsEmptyElement)
                {
                    throw DiagnosticUtility.ExceptionUtility.ThrowHelperXml(reader, SR.GetString("MSIS0005", new object[] { reader.LocalName, reader.NamespaceURI }));
                }
                RequestedAuthenticationContext context = new RequestedAuthenticationContext();
                XmlUtil.ValidateXsiType(reader, "RequestedAuthnContextType", "urn:oasis:names:tc:SAML:2.0:protocol");
                string attribute = reader.GetAttribute("Comparison");
                if (!string.IsNullOrEmpty(attribute))
                {
                    string str2 = attribute;
                    if (str2 == null)
                    {
                        goto Label_00F8;
                    }
                    if (!(str2 == "exact"))
                    {
                        if (str2 == "minimum")
                        {
                            goto Label_00DD;
                        }
                        if (str2 == "maximum")
                        {
                            goto Label_00E6;
                        }
                        if (str2 == "better")
                        {
                            goto Label_00EF;
                        }
                        goto Label_00F8;
                    }
                    context.Comparison = AuthenticationContextComparisonType.Exact;
                }
                goto Label_0118;
            Label_00DD:
                context.Comparison = AuthenticationContextComparisonType.Minimum;
                goto Label_0118;
            Label_00E6:
                context.Comparison = AuthenticationContextComparisonType.Maximum;
                goto Label_0118;
            Label_00EF:
                context.Comparison = AuthenticationContextComparisonType.Better;
                goto Label_0118;
            Label_00F8: ;
                throw DiagnosticUtility.ExceptionUtility.ThrowHelperXml(reader, SR.GetString("MSIS0011", new object[] { attribute }));
            Label_0118:
                reader.ReadStartElement();
                if (reader.IsStartElement("AuthnContextClassRef", "urn:oasis:names:tc:SAML:2.0:assertion"))
                {
                    context.ReferenceType = AuthenticationContextReferenceType.Class;
                    while (reader.IsStartElement("AuthnContextClassRef", "urn:oasis:names:tc:SAML:2.0:assertion"))
                    {
                        context.References.Add(ReadSimpleUriElement(reader));
                    }
                }
                else
                {
                    if (!reader.IsStartElement("AuthnContextDeclRef", "urn:oasis:names:tc:SAML:2.0:assertion"))
                    {
                        throw DiagnosticUtility.ExceptionUtility.ThrowHelperXml(reader, SR.GetString("MSIS0012", new object[0]));
                    }
                    context.ReferenceType = AuthenticationContextReferenceType.Declaration;
                    while (reader.IsStartElement("AuthnContextDeclRef", "urn:oasis:names:tc:SAML:2.0:assertion"))
                    {
                        context.References.Add(ReadSimpleUriElement(reader));
                    }
                }
                reader.ReadEndElement();
                context2 = context;
            }
            catch (Exception exception)
            {
                throw exception;
            }
            return context2;
        }

        private static Uri ReadSimpleUriElement(XmlReader reader)
        {
            Uri uri2;
            if (reader == null)
            {
                throw new ArgumentNullException("reader");
            }
            try
            {
                if (!reader.IsStartElement())
                {
                    reader.ReadStartElement();
                }
                if (reader.IsEmptyElement)
                {
                    throw DiagnosticUtility.ExceptionUtility.ThrowHelperXml(reader, SR.GetString("MSIS0005", new object[] { reader.LocalName, reader.NamespaceURI }));
                }
                XmlUtil.ValidateXsiType(reader, "anyURI", "http://www.w3.org/2001/XMLSchema");
                reader.ReadStartElement();
                Uri uri = new Uri(reader.ReadContentAsString());
                reader.ReadEndElement();
                uri2 = uri;
            }
            catch (Exception exception)
            {
                throw exception;
            }
            return uri2;
        }

        internal virtual Scoping ReadScoping(XmlReader reader)
        {
            Scoping scoping3;
            if (reader == null)
            {
                throw new ArgumentNullException("reader");
            }
            try
            {
                if (!reader.IsStartElement("Scoping", "urn:oasis:names:tc:SAML:2.0:protocol"))
                {
                    reader.ReadStartElement("Scoping", "urn:oasis:names:tc:SAML:2.0:protocol");
                }
                bool isEmptyElement = reader.IsEmptyElement;
                Scoping scoping = new Scoping();
                XmlUtil.ValidateXsiType(reader, "ScopingType", "urn:oasis:names:tc:SAML:2.0:protocol");
                string attribute = reader.GetAttribute("ProxyCount");
                if (!string.IsNullOrEmpty(attribute))
                {
                    scoping.ProxyCount = new int?(XmlConvert.ToInt32(attribute));
                }
                reader.ReadStartElement();
                if (!isEmptyElement)
                {
                    if (reader.IsStartElement("IDPList", "urn:oasis:names:tc:SAML:2.0:protocol"))
                    {
                        Scoping scoping2 = scoping;
                        scoping = new Scoping(this.ReadIDPList(reader))
                        {
                            ProxyCount = scoping2.ProxyCount
                        };
                    }
                    while (reader.IsStartElement("RequesterID", "urn:oasis:names:tc:SAML:2.0:protocol"))
                    {
                        scoping.RequesterIds.Add(ReadSimpleUriElement(reader));
                    }
                    reader.ReadEndElement();
                }
                scoping3 = scoping;
            }
            catch (Exception exception)
            {
                throw exception;
            }
            return scoping3;
        }

        internal virtual IdentityProviderCollection ReadIDPList(XmlReader reader)
        {
            IdentityProviderCollection providers2;
            if (reader == null)
            {
                throw new ArgumentNullException("reader");
            }
            try
            {
                if (!reader.IsStartElement("IDPList", "urn:oasis:names:tc:SAML:2.0:protocol"))
                {
                    reader.ReadStartElement("IDPList", "urn:oasis:names:tc:SAML:2.0:protocol");
                }
                if (reader.IsEmptyElement)
                {
                    throw DiagnosticUtility.ExceptionUtility.ThrowHelperXml(reader, SR.GetString("MSIS0005", new object[] { reader.LocalName, reader.NamespaceURI }));
                }
                IdentityProviderCollection providers = new IdentityProviderCollection();
                XmlUtil.ValidateXsiType(reader, "IDPListType", "urn:oasis:names:tc:SAML:2.0:protocol");
                reader.ReadStartElement();
                while (reader.IsStartElement("IDPEntry", "urn:oasis:names:tc:SAML:2.0:protocol"))
                {
                    providers.Add(this.ReadIDPEntry(reader));
                }
                if (providers.Count == 0)
                {
                    throw DiagnosticUtility.ExceptionUtility.ThrowHelperXml(reader, SR.GetString("MSIS0010", new object[] { "IDPEntry" }));
                }
                if (reader.IsStartElement("GetComplete", "urn:oasis:names:tc:SAML:2.0:protocol"))
                {
                    providers.GetComplete = ReadSimpleUriElement(reader);
                }
                reader.ReadEndElement();
                providers2 = providers;
            }
            catch (Exception exception)
            {
                throw exception;
            }
            return providers2;
        }

        internal virtual IdentityProviderEntry ReadIDPEntry(XmlReader reader)
        {
            IdentityProviderEntry entry2;
            if (reader == null)
            {
                throw new ArgumentNullException("reader");
            }
            try
            {
                if (!reader.IsStartElement("IDPEntry", "urn:oasis:names:tc:SAML:2.0:protocol"))
                {
                    reader.ReadStartElement("IDPEntry", "urn:oasis:names:tc:SAML:2.0:protocol");
                }
                bool isEmptyElement = reader.IsEmptyElement;
                XmlUtil.ValidateXsiType(reader, "IDPEntryType", "urn:oasis:names:tc:SAML:2.0:protocol");
                string attribute = reader.GetAttribute("ProviderID");
                if (string.IsNullOrEmpty(attribute))
                {
                    throw DiagnosticUtility.ExceptionUtility.ThrowHelperXml(reader, SR.GetString("MSIS0006", new object[] { "ProviderID" }));
                }
                IdentityProviderEntry entry = new IdentityProviderEntry(new Uri(attribute));
                attribute = reader.GetAttribute("Name");
                if (!string.IsNullOrEmpty(attribute))
                {
                    entry.Name = attribute;
                }
                attribute = reader.GetAttribute("Loc");
                if (!string.IsNullOrEmpty(attribute))
                {
                    entry.Location = new Uri(attribute);
                }
                reader.ReadStartElement();
                if (!isEmptyElement)
                {
                    reader.ReadEndElement();
                }
                entry2 = entry;
            }
            catch (Exception exception)
            {
                throw exception;
            }
            return entry2;
        }

        protected virtual Saml2NameIdentifier ReadNameIDType(XmlReader reader)
        {
            Saml2NameIdentifier identifier2;
            try
            {
                reader.MoveToContent();
                Saml2NameIdentifier identifier = new Saml2NameIdentifier("__TemporaryName__");
                XmlUtil.ValidateXsiType(reader, "NameIDType", "urn:oasis:names:tc:SAML:2.0:assertion");
                string attribute = reader.GetAttribute("Format");
                if (!string.IsNullOrEmpty(attribute))
                {
                    if (!UriUtil.CanCreateValidUri(attribute, UriKind.Absolute))
                    {
                        throw DiagnosticUtility.ExceptionUtility.ThrowHelperXml(reader, SR.GetString("ID0011", new object[] { "Format", "NameID" }));
                    }
                    identifier.Format = new Uri(attribute);
                }
                attribute = reader.GetAttribute("NameQualifier");
                if (!string.IsNullOrEmpty(attribute))
                {
                    identifier.NameQualifier = attribute;
                }
                attribute = reader.GetAttribute("SPNameQualifier");
                if (!string.IsNullOrEmpty(attribute))
                {
                    identifier.SPNameQualifier = attribute;
                }
                attribute = reader.GetAttribute("SPProvidedID");
                if (!string.IsNullOrEmpty(attribute))
                {
                    identifier.SPProvidedId = attribute;
                }
                identifier.Value = reader.ReadElementString();
                if ((identifier.Format != null) && StringComparer.Ordinal.Equals(identifier.Format.AbsoluteUri, Saml2Constants.NameIdentifierFormats.Entity.AbsoluteUri))
                {
                    if (!UriUtil.CanCreateValidUri(identifier.Value, UriKind.Absolute))
                    {
                        throw DiagnosticUtility.ExceptionUtility.ThrowHelperXml(reader, SR.GetString("ID4262", new object[] { identifier.Value, Saml2Constants.NameIdentifierFormats.Entity.AbsoluteUri }));
                    }
                    if ((!string.IsNullOrEmpty(identifier.NameQualifier) || !string.IsNullOrEmpty(identifier.SPNameQualifier)) || !string.IsNullOrEmpty(identifier.SPProvidedId))
                    {
                        throw DiagnosticUtility.ExceptionUtility.ThrowHelperXml(reader, SR.GetString("ID4263", new object[] { identifier.Value, Saml2Constants.NameIdentifierFormats.Entity.AbsoluteUri }));
                    }
                }
                identifier2 = identifier;
            }
            catch (Exception exception)
            {
                Exception exception2 = exception; // TryWrapReadException(reader, exception);
                if (exception2 == null)
                {
                    throw;
                }
                throw exception2;
            }
            return identifier2;
        }

 

 

    }
}
