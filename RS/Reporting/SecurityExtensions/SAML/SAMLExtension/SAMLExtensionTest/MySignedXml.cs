using System;
using System.Collections.Generic;
using System.Collections;
using System.Xml;
using System.Security.Cryptography;
using System.Security.Cryptography.Xml;
using System.Security.Cryptography.X509Certificates;
using System.Reflection;
using System.IO;

namespace SAMLExtensionTest
{
    internal class CanonicalXmlNodeList : XmlNodeList, IList, ICollection, IEnumerable
    {
        // Fields
        private ArrayList m_nodeArray = new ArrayList();

        // Methods
        internal CanonicalXmlNodeList()
        {
        }

        public int Add(object value)
        {
            if (!(value is XmlNode))
            {
                throw new ArgumentException("Cryptography_Xml_IncorrectObjectType node");
            }
            return this.m_nodeArray.Add(value);
        }

        public void Clear()
        {
            this.m_nodeArray.Clear();
        }

        public bool Contains(object value)
        {
            return this.m_nodeArray.Contains(value);
        }

        public void CopyTo(Array array, int index)
        {
            this.m_nodeArray.CopyTo(array, index);
        }

        public override IEnumerator GetEnumerator()
        {
            return this.m_nodeArray.GetEnumerator();
        }

        public int IndexOf(object value)
        {
            return this.m_nodeArray.IndexOf(value);
        }

        public void Insert(int index, object value)
        {
            if (!(value is XmlNode))
            {
                throw new ArgumentException("Cryptography_Xml_IncorrectObjectType value");
            }
            this.m_nodeArray.Insert(index, value);
        }

        public override XmlNode Item(int index)
        {
            return (XmlNode)this.m_nodeArray[index];
        }

        public void Remove(object value)
        {
            this.m_nodeArray.Remove(value);
        }

        public void RemoveAt(int index)
        {
            this.m_nodeArray.RemoveAt(index);
        }

        // Properties
        public override int Count
        {
            get
            {
                return this.m_nodeArray.Count;
            }
        }

        public bool IsFixedSize
        {
            get
            {
                return this.m_nodeArray.IsFixedSize;
            }
        }

        public bool IsReadOnly
        {
            get
            {
                return this.m_nodeArray.IsReadOnly;
            }
        }

        public bool IsSynchronized
        {
            get
            {
                return this.m_nodeArray.IsSynchronized;
            }
        }

        public object SyncRoot
        {
            get
            {
                return this.m_nodeArray.SyncRoot;
            }
        }

        object IList.this[int index]
        {
            get
            {
                return this.m_nodeArray[index];
            }
            set
            {
                if (!(value is XmlNode))
                {
                    throw new ArgumentException("Cryptography_Xml_IncorrectObjectType" + value.ToString());
                }
                this.m_nodeArray[index] = value;
            }
        }
    }

    internal class Utils
    {
        internal class MyXmlDocument : XmlDocument
        {
            // Methods
            protected override XmlAttribute CreateDefaultAttribute(string prefix, string localName, string namespaceURI)
            {
                return this.CreateAttribute(prefix, localName, namespaceURI);
            }
        }

        internal static void AddNamespaces(XmlElement elem, CanonicalXmlNodeList namespaces)
        {
            if (namespaces != null)
            {
                foreach (XmlNode node in namespaces)
                {
                    string name = (node.Prefix.Length > 0) ? (node.Prefix + ":" + node.LocalName) : node.LocalName;
                    if (!elem.HasAttribute(name) && (!name.Equals("xmlns") || (elem.Prefix.Length != 0)))
                    {
                        XmlAttribute newAttr = elem.OwnerDocument.CreateAttribute(name);
                        newAttr.Value = node.Value;
                        elem.SetAttributeNode(newAttr);
                    }
                }
            }
        }

        internal static CanonicalXmlNodeList GetPropagatedAttributes(XmlElement elem)
        {
            if (elem == null)
            {
                return null;
            }
            CanonicalXmlNodeList list = new CanonicalXmlNodeList();
            XmlNode parentNode = elem;
            if (parentNode == null)
            {
                return null;
            }
            bool flag = true;
            while (parentNode != null)
            {
                XmlElement element = parentNode as XmlElement;
                if (element == null)
                {
                    parentNode = parentNode.ParentNode;
                }
                else
                {
                    if (!IsCommittedNamespace(element, element.Prefix, element.NamespaceURI) && !IsRedundantNamespace(element, element.Prefix, element.NamespaceURI))
                    {
                        string name = (element.Prefix.Length > 0) ? ("xmlns:" + element.Prefix) : "xmlns";
                        XmlAttribute attribute = elem.OwnerDocument.CreateAttribute(name);
                        attribute.Value = element.NamespaceURI;
                        list.Add(attribute);
                    }
                    if (element.HasAttributes)
                    {
                        foreach (XmlAttribute attribute2 in element.Attributes)
                        {
                            if (flag && (attribute2.LocalName == "xmlns"))
                            {
                                XmlAttribute attribute3 = elem.OwnerDocument.CreateAttribute("xmlns");
                                attribute3.Value = attribute2.Value;
                                list.Add(attribute3);
                                flag = false;
                            }
                            else if ((attribute2.Prefix == "xmlns") || (attribute2.Prefix == "xml"))
                            {
                                list.Add(attribute2);
                            }
                            else if (((attribute2.NamespaceURI.Length > 0) && !IsCommittedNamespace(element, attribute2.Prefix, attribute2.NamespaceURI)) && !IsRedundantNamespace(element, attribute2.Prefix, attribute2.NamespaceURI))
                            {
                                string str2 = (attribute2.Prefix.Length > 0) ? ("xmlns:" + attribute2.Prefix) : "xmlns";
                                XmlAttribute attribute4 = elem.OwnerDocument.CreateAttribute(str2);
                                attribute4.Value = attribute2.NamespaceURI;
                                list.Add(attribute4);
                            }
                        }
                    }
                    parentNode = parentNode.ParentNode;
                }
            }
            return list;
        }

        internal static bool IsCommittedNamespace(XmlElement element, string prefix, string value)
        {
            if (element == null)
            {
                throw new ArgumentNullException("element");
            }
            string name = (prefix.Length > 0) ? ("xmlns:" + prefix) : "xmlns";
            return (element.HasAttribute(name) && (element.GetAttribute(name) == value));
        }

        internal static bool IsRedundantNamespace(XmlElement element, string prefix, string value)
        {
            if (element == null)
            {
                throw new ArgumentNullException("element");
            }
            for (XmlNode node = element.ParentNode; node != null; node = node.ParentNode)
            {
                XmlElement element2 = node as XmlElement;
                if ((element2 != null) && HasNamespace(element2, prefix, value))
                {
                    return true;
                }
            }
            return false;
        }

        private static bool HasNamespace(XmlElement element, string prefix, string value)
        {
            return (IsCommittedNamespace(element, prefix, value) || ((element.Prefix == prefix) && (element.NamespaceURI == value)));
        }

        internal static XmlDocument PreProcessElementInput(XmlElement elem, XmlResolver xmlResolver, string baseUri)
        {
            if (elem == null)
            {
                throw new ArgumentNullException("elem");
            }
            MyXmlDocument document = new MyXmlDocument
            {
                PreserveWhitespace = true
            };
            using (TextReader reader = new StringReader(elem.OuterXml))
            {
                XmlReaderSettings settings = new XmlReaderSettings
                {
                    XmlResolver = xmlResolver,
                    ProhibitDtd = false
                };
                XmlReader reader2 = XmlReader.Create(reader, settings, baseUri);
                document.Load(reader2);
            }
            return document;
        }
    }

    public class MySignedXml
    {
        // Fields
        private byte[] _digestedSignedInfo;
        private const string AllowHMACTruncationValue = "AllowHMACTruncation";
        private bool bCacheValid;
        private bool m_bResolverSet;
        private XmlDocument m_containingDocument;
        internal XmlElement m_context;
        private EncryptedXml m_exml;
        private IEnumerator m_keyInfoEnum;
        private int[] m_refLevelCache;
        private bool[] m_refProcessed;
        protected Signature m_signature;
        private AsymmetricAlgorithm m_signingKey;
        protected string m_strSigningKeyName;
        private X509Certificate2Collection m_x509Collection;
        private IEnumerator m_x509Enum;
        internal XmlResolver m_xmlResolver;
        private static bool? s_allowHmacTruncation;
        public const string XmlDecryptionTransformUrl = "http://www.w3.org/2002/07/decrypt#XML";
        public const string XmlDsigBase64TransformUrl = "http://www.w3.org/2000/09/xmldsig#base64";
        public const string XmlDsigC14NTransformUrl = "http://www.w3.org/TR/2001/REC-xml-c14n-20010315";
        public const string XmlDsigC14NWithCommentsTransformUrl = "http://www.w3.org/TR/2001/REC-xml-c14n-20010315#WithComments";
        public const string XmlDsigCanonicalizationUrl = "http://www.w3.org/TR/2001/REC-xml-c14n-20010315";
        public const string XmlDsigCanonicalizationWithCommentsUrl = "http://www.w3.org/TR/2001/REC-xml-c14n-20010315#WithComments";
        public const string XmlDsigDSAUrl = "http://www.w3.org/2000/09/xmldsig#dsa-sha1";
        public const string XmlDsigEnvelopedSignatureTransformUrl = "http://www.w3.org/2000/09/xmldsig#enveloped-signature";
        public const string XmlDsigExcC14NTransformUrl = "http://www.w3.org/2001/10/xml-exc-c14n#";
        public const string XmlDsigExcC14NWithCommentsTransformUrl = "http://www.w3.org/2001/10/xml-exc-c14n#WithComments";
        public const string XmlDsigHMACSHA1Url = "http://www.w3.org/2000/09/xmldsig#hmac-sha1";
        public const string XmlDsigMinimalCanonicalizationUrl = "http://www.w3.org/2000/09/xmldsig#minimal";
        private const string XmlDsigMoreHMACMD5Url = "http://www.w3.org/2001/04/xmldsig-more#hmac-md5";
        private const string XmlDsigMoreHMACRIPEMD160Url = "http://www.w3.org/2001/04/xmldsig-more#hmac-ripemd160";
        private const string XmlDsigMoreHMACSHA256Url = "http://www.w3.org/2001/04/xmldsig-more#hmac-sha256";
        private const string XmlDsigMoreHMACSHA384Url = "http://www.w3.org/2001/04/xmldsig-more#hmac-sha384";
        private const string XmlDsigMoreHMACSHA512Url = "http://www.w3.org/2001/04/xmldsig-more#hmac-sha512";
        public const string XmlDsigNamespaceUrl = "http://www.w3.org/2000/09/xmldsig#";
        public const string XmlDsigRSASHA1Url = "http://www.w3.org/2000/09/xmldsig#rsa-sha1";
        public const string XmlDsigSHA1Url = "http://www.w3.org/2000/09/xmldsig#sha1";
        public const string XmlDsigXPathTransformUrl = "http://www.w3.org/TR/1999/REC-xpath-19991116";
        public const string XmlDsigXsltTransformUrl = "http://www.w3.org/TR/1999/REC-xslt-19991116";
        public const string XmlLicenseTransformUrl = "urn:mpeg:mpeg21:2003:01-REL-R-NS:licenseTransform";
        private SignedXml myInner;
        public MySignedXml(XmlElement element)
        {
            this.m_containingDocument = (element == null) ? null : element.OwnerDocument;
            this.m_context = element;
            this.myInner = new SignedXml(element);
            this.m_signature = new Signature();
            
            PropertyInfo propInfo = typeof(Signature).GetProperty("SignedXml", BindingFlags.SetProperty | BindingFlags.Instance | BindingFlags.NonPublic);
            propInfo.SetValue(this.m_signature, this.myInner, null);
            //this.m_signature.SignedXml = this;
            this.m_signature.SignedInfo = new SignedInfo();
            this.m_signingKey = null;
        }

        public string SignatureMethod
        {
            get
            {
                return this.m_signature.SignedInfo.SignatureMethod;
            }
        }
 
        private bool CheckSignedInfo(AsymmetricAlgorithm key)
        {
            if (key == null)
            {
                throw new ArgumentNullException("key");
            }
            SignatureDescription description = CryptoConfig.CreateFromName(this.SignatureMethod) as SignatureDescription;
            if (description == null)
            {
                throw new CryptographicException("Cryptography_Xml_SignatureDescriptionNotCreated");
            }
            Type c = Type.GetType(description.KeyAlgorithm);
            Type type = key.GetType();
            if (((c != type) && !c.IsSubclassOf(type)) && !type.IsSubclassOf(c))
            {
                return false;
            }
            HashAlgorithm hash = description.CreateDigest();
            if (hash == null)
            {
                throw new CryptographicException("Cryptography_Xml_CreateHashAlgorithmFailed");
            }

            byte[] rgbHash = this.GetC14NDigest(hash);
            return description.CreateDeformatter(key).VerifySignature(rgbHash, this.m_signature.SignatureValue);
        }

        public bool CheckSignature(AsymmetricAlgorithm key)
        {
            bool innerValue = myInner.CheckSignature(key);
            if (!this.CheckSignedInfo(key))
            {
                return false;
            }
            return this.CheckDigestedReferences();
        }

        public void LoadXml(XmlElement value)
        {
            if (value == null)
            {
                throw new ArgumentNullException("value");
            }
            this.m_signature.LoadXml(value);
            this.m_context = value;
            this.bCacheValid = false;
            myInner.LoadXml(value);
        }

        private bool CheckDigestedReferences()
        {
            ArrayList references = this.m_signature.SignedInfo.References;
            for (int i = 0; i < references.Count; i++)
            {
                Reference reference = (Reference)references[i];

                PropertyInfo propInfo = typeof(Signature).GetProperty("ReferencedItems", BindingFlags.GetProperty | BindingFlags.Instance | BindingFlags.NonPublic);
                Object referenceItems = propInfo.GetValue(this.m_signature, null);

                Type referenceType = typeof(Reference);
                byte[] buffer = (byte[])referenceType.InvokeMember("CalculateHashValue",
                        BindingFlags.InvokeMethod | BindingFlags.Instance | BindingFlags.NonPublic,
                        null, reference, new object[] { this.m_containingDocument, referenceItems });
                //byte[] buffer = reference.CalculateHashValue(this.m_containingDocument, referenceItems);
                if (buffer.Length != reference.DigestValue.Length)
                {
                    return false;
                }
                byte[] buffer2 = buffer;
                byte[] digestValue = reference.DigestValue;
                for (int j = 0; j < buffer2.Length; j++)
                {
                    if (buffer2[j] != digestValue[j])
                    {
                        return false;
                    }
                }
            }
            return true;
        } 

        public SignedInfo SignedInfo
        {
            get
            {
                return this.m_signature.SignedInfo;
            }
        }
 
        private byte[] GetC14NDigest(HashAlgorithm hash)
        {
            PropertyInfo propInfo1 = typeof(SignedInfo).GetProperty("CacheValid", BindingFlags.GetProperty | BindingFlags.Instance | BindingFlags.NonPublic);
            bool signedInfoCacheValid = (bool)propInfo1.GetValue(this.SignedInfo, null);
            if (!this.bCacheValid || !signedInfoCacheValid)
            {
                string securityUrl = (this.m_containingDocument == null) ? null : this.m_containingDocument.BaseURI;
                XmlResolver xmlResolver = this.m_bResolverSet ? this.m_xmlResolver : new XmlSecureResolver(new XmlUrlResolver(), securityUrl);
                XmlDocument document = Utils.PreProcessElementInput(this.SignedInfo.GetXml(), xmlResolver, securityUrl);
                CanonicalXmlNodeList namespaces = (this.m_context == null) ? null : Utils.GetPropagatedAttributes(this.m_context);
                Utils.AddNamespaces(document.DocumentElement, namespaces);
                Transform canonicalizationMethodObject = this.SignedInfo.CanonicalizationMethodObject;
                canonicalizationMethodObject.Resolver = xmlResolver;
                PropertyInfo propInfo = typeof(Transform).GetProperty("BaseURI", BindingFlags.SetProperty | BindingFlags.Instance | BindingFlags.NonPublic);
                propInfo.SetValue(canonicalizationMethodObject, securityUrl, null);
                //canonicalizationMethodObject.BaseURI = securityUrl;
                canonicalizationMethodObject.LoadInput(document);
                this._digestedSignedInfo = canonicalizationMethodObject.GetDigestedOutput(hash);
                this.bCacheValid = true;
            }
            return this._digestedSignedInfo;
        }
    }

    internal class MyDeformatter
    {
            // Fields
        private RSA _rsaKey;
        private string _strOID = "http://www.w3.org/2000/09/xmldsig#sha1";

        // Methods
        public MyDeformatter()
        {
        }

        public MyDeformatter(AsymmetricAlgorithm key)
        {
            if (key == null)
            {
                throw new ArgumentNullException("key");
            }
            this._rsaKey = (RSA) key;
        }
    }
}
