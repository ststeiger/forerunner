using System;
using System.Collections.Generic;
using System.Reflection;
using System.Web;
using System.Xml;
using System.IO;
using Microsoft.IdentityModel.Tokens.Saml2;

namespace TestSSO2
{
    public class WIFHelper
    {
        private System.Reflection.Assembly o = System.Reflection.Assembly.LoadWithPartialName("Microsoft.IdentityServer");
        private Type samlProtocolSerializerType;
        private Type authnRequestType;
        private Type nameIdentifierPolicyType;

        private Object samlProtocolSerializer;
        private Object authnRequest;
        private Object nameIdentifierPolicy;


        public WIFHelper() 
        {
            samlProtocolSerializerType = o.GetType("Microsoft.IdentityServer.Protocols.Saml.SamlProtocolSerializer");
            authnRequestType = o.GetType("Microsoft.IdentityServer.Protocols.Saml.AuthenticationRequest");
            nameIdentifierPolicyType = o.GetType("Microsoft.IdentityServer.Protocols.Saml.NameIdentifierPolicy");
            samlProtocolSerializer = createSamlProtocolSerializer();
            authnRequest = createAuthenticationRequest();
            nameIdentifierPolicy = createNameIdentifierPolicy();
        }

        private Object createInstanceOfType(Type t)
        {
            return Activator.CreateInstance(t);
        }

        private Type getType(String typeName)
        {
            return o.GetType(typeName);
        }

        private Object createSamlProtocolSerializer() 
        {
            return createInstanceOfType(samlProtocolSerializerType);
            
        }

        private Object createAuthenticationRequest()
        {
            return createInstanceOfType(authnRequestType);
        }

        private Object createNameIdentifierPolicy()
        {
            return createInstanceOfType(nameIdentifierPolicyType);
        }

        public void setRequestProperties(Uri ACSUrl, String providerName, String issuer)
        {
            PropertyInfo propInfo = authnRequestType.GetProperty("AssertionConsumerServiceUrl");
            propInfo.SetValue(authnRequest, ACSUrl, null);
            propInfo = authnRequestType.GetProperty("ProviderName");
            propInfo.SetValue(authnRequest, providerName, null);

            propInfo = nameIdentifierPolicyType.GetProperty("AllowCreate");
            propInfo.SetValue(nameIdentifierPolicy, true, null);
            propInfo = nameIdentifierPolicyType.GetProperty("Format");
            propInfo.SetValue(nameIdentifierPolicy, new Uri("urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified"), null);

            propInfo = authnRequestType.GetProperty("NameIdentifierPolicy");
            propInfo.SetValue(authnRequest, nameIdentifierPolicy, null);
            propInfo = authnRequestType.GetProperty("ProtocolBinding");
            propInfo.SetValue(authnRequest, new Uri("urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"), null);
            propInfo = authnRequestType.GetProperty("Issuer");
            propInfo.SetValue(authnRequest, new Saml2NameIdentifier(issuer), null);
            propInfo = authnRequestType.GetProperty("Destination");
            propInfo.SetValue(authnRequest, new Uri("https://halberd.contrivance.org/adfs/ls/auth/integrated/"), null);
        }

        public void writeSamlRequest(XmlWriter writer)
        {
            samlProtocolSerializerType.InvokeMember("WriteAuthnRequest",
                BindingFlags.InvokeMethod | BindingFlags.Instance | BindingFlags.NonPublic,
                null, samlProtocolSerializer, new object[] { writer, authnRequest });
        }

        public string getSAMLRequest()
        {
            using (StringWriter stringWriter = new StringWriter())
            {
                XmlWriterSettings xmlWriterSettings = new XmlWriterSettings();
                xmlWriterSettings.OmitXmlDeclaration = true;

                using (XmlWriter xmlWriter = XmlWriter.Create(stringWriter, xmlWriterSettings))
                {
                    writeSamlRequest(xmlWriter);
                }
                return stringWriter.ToString();
            }
        }
    }
}