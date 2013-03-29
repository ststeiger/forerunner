using System;
using System.Collections.Generic;
using System.Xml;
using System.Xml.Schema;
using System.Text;

namespace TestSAMLUtils
{
    internal class NamespaceContext
    {
        // Fields
        private readonly Stack<HashSet<XmlNamespaceDeclaration>> _namespaces;

        // Methods
        public NamespaceContext(Stack<HashSet<XmlNamespaceDeclaration>> namespaces)
        {
            this._namespaces = namespaces;
        }

        public List<XmlNamespaceDeclaration> GetNamespaces()
        {
            List<XmlNamespaceDeclaration> list = new List<XmlNamespaceDeclaration>();
            HashSet<string> set = new HashSet<string>();
            foreach (HashSet<XmlNamespaceDeclaration> set2 in this._namespaces)
            {
                foreach (XmlNamespaceDeclaration declaration in set2)
                {
                    if (!set.Contains(declaration.Prefix))
                    {
                        set.Add(declaration.Prefix);
                        list.Add(declaration);
                    }
                }
            }
            return list;
        }
    }

    internal class XmlNamespaceDeclaration
    {
        // Fields
        private string _ns;
        private string _prefix;

        // Methods
        public XmlNamespaceDeclaration(string prefix, string ns)
        {
            this._prefix = prefix;
            this._ns = ns;
        }

        // Properties
        public string Namespace
        {
            get
            {
                return this._ns;
            }
        }

        public string Prefix
        {
            get
            {
                return this._prefix;
            }
        }
    }

    internal abstract class XmlDelegatingReader : XmlReader
    {
        // Fields
        protected XmlReader _reader;

        // Methods
        public XmlDelegatingReader(XmlReader reader)
        {
            if (reader == null)
            {
                throw new ArgumentNullException("reader");
            }
            this._reader = reader;
        }

        public override void Close()
        {
            this._reader.Close();
        }

        public override string GetAttribute(int i)
        {
            return this._reader.GetAttribute(i);
        }

        public override string GetAttribute(string name)
        {
            return this._reader.GetAttribute(name);
        }

        public override string GetAttribute(string name, string namespaceURI)
        {
            return this._reader.GetAttribute(name, namespaceURI);
        }

        public override int GetHashCode()
        {
            return this._reader.GetHashCode();
        }

        public override string LookupNamespace(string prefix)
        {
            return this._reader.LookupNamespace(prefix);
        }

        public override bool MoveToAttribute(string name)
        {
            return this._reader.MoveToAttribute(name);
        }

        public override bool MoveToAttribute(string name, string ns)
        {
            return this._reader.MoveToAttribute(name, ns);
        }

        public override bool MoveToElement()
        {
            return this._reader.MoveToElement();
        }

        public override bool MoveToFirstAttribute()
        {
            return this._reader.MoveToFirstAttribute();
        }

        public override bool MoveToNextAttribute()
        {
            return this._reader.MoveToNextAttribute();
        }

        public override bool Read()
        {
            return this._reader.Read();
        }

        public override bool ReadAttributeValue()
        {
            return this._reader.ReadAttributeValue();
        }

        public override int ReadContentAsBase64(byte[] buffer, int index, int count)
        {
            return this._reader.ReadContentAsBase64(buffer, index, count);
        }

        public override int ReadContentAsBinHex(byte[] buffer, int index, int count)
        {
            return this._reader.ReadContentAsBinHex(buffer, index, count);
        }

        public override int ReadElementContentAsBase64(byte[] buffer, int index, int count)
        {
            return this._reader.ReadElementContentAsBase64(buffer, index, count);
        }

        public override int ReadElementContentAsBinHex(byte[] buffer, int index, int count)
        {
            return this._reader.ReadElementContentAsBinHex(buffer, index, count);
        }

        public override int ReadValueChunk(char[] buffer, int index, int count)
        {
            return this._reader.ReadValueChunk(buffer, index, count);
        }

        public override void ResolveEntity()
        {
            this._reader.ResolveEntity();
        }

        // Properties
        public override int AttributeCount
        {
            get
            {
                return this._reader.AttributeCount;
            }
        }

        public override string BaseURI
        {
            get
            {
                return this._reader.BaseURI;
            }
        }

        public override bool CanReadBinaryContent
        {
            get
            {
                return this._reader.CanReadBinaryContent;
            }
        }

        public override bool CanReadValueChunk
        {
            get
            {
                return this._reader.CanReadValueChunk;
            }
        }

        public override bool CanResolveEntity
        {
            get
            {
                return this._reader.CanResolveEntity;
            }
        }

        public override int Depth
        {
            get
            {
                return this._reader.Depth;
            }
        }

        public override bool EOF
        {
            get
            {
                return this._reader.EOF;
            }
        }

        public override bool HasAttributes
        {
            get
            {
                return this._reader.HasAttributes;
            }
        }

        public override bool HasValue
        {
            get
            {
                return this._reader.HasValue;
            }
        }

        public override bool IsDefault
        {
            get
            {
                return this._reader.IsDefault;
            }
        }

        public override bool IsEmptyElement
        {
            get
            {
                return this._reader.IsEmptyElement;
            }
        }

        public override string LocalName
        {
            get
            {
                return this._reader.LocalName;
            }
        }

        public override string Name
        {
            get
            {
                return this._reader.Name;
            }
        }

        public override string NamespaceURI
        {
            get
            {
                return this._reader.NamespaceURI;
            }
        }

        public override XmlNameTable NameTable
        {
            get
            {
                return this._reader.NameTable;
            }
        }

        public override XmlNodeType NodeType
        {
            get
            {
                return this._reader.NodeType;
            }
        }

        public override string Prefix
        {
            get
            {
                return this._reader.Prefix;
            }
        }

        public override char QuoteChar
        {
            get
            {
                return this._reader.QuoteChar;
            }
        }

        public override ReadState ReadState
        {
            get
            {
                return this._reader.ReadState;
            }
        }

        public override IXmlSchemaInfo SchemaInfo
        {
            get
            {
                return this._reader.SchemaInfo;
            }
        }

        public override XmlReaderSettings Settings
        {
            get
            {
                return this._reader.Settings;
            }
        }

        public override string Value
        {
            get
            {
                return this._reader.Value;
            }
        }

        public override Type ValueType
        {
            get
            {
                return this._reader.ValueType;
            }
        }

        public override string XmlLang
        {
            get
            {
                return this._reader.XmlLang;
            }
        }

        public override XmlSpace XmlSpace
        {
            get
            {
                return this._reader.XmlSpace;
            }
        }
    } 

    internal class XmlNamespaceReader : XmlDelegatingReader
    {
        // Fields
        private NamespaceContext _context;
        private Stack<HashSet<XmlNamespaceDeclaration>> _namespaces;

        // Methods
        public XmlNamespaceReader(XmlReader reader)
            : base(reader)
        {
            this._namespaces = new Stack<HashSet<XmlNamespaceDeclaration>>();
            this._context = new NamespaceContext(this._namespaces);
        }

        private void AddNamespaceDeclarations()
        {
            HashSet<XmlNamespaceDeclaration> item = new HashSet<XmlNamespaceDeclaration>();
            if (base._reader.HasAttributes)
            {
                for (int i = 0; i < base._reader.AttributeCount; i++)
                {
                    base._reader.MoveToAttribute(i);
                    if (base._reader.Prefix.Equals("xmlns"))
                    {
                        item.Add(new XmlNamespaceDeclaration(base._reader.LocalName, base._reader.Value));
                    }
                }
                base._reader.MoveToElement();
            }
            this._namespaces.Push(item);
        }

        public override bool Read()
        {
            if ((base._reader.NodeType == XmlNodeType.Element) && !base._reader.IsEmptyElement)
            {
                this.AddNamespaceDeclarations();
            }
            else if (base._reader.NodeType == XmlNodeType.EndElement)
            {
                this._namespaces.Pop();
            }
            return base._reader.Read();
        }

        // Properties
        public NamespaceContext NamespaceContext
        {
            get
            {
                return this._context;
            }
        }

    }
}
