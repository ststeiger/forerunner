using System;
using System.Collections.ObjectModel;
using System.Collections.Generic;
using System.Text;

namespace TestSAMLUtils
{
public class Saml2NameIdentifier
{
    // Fields
    private EncryptingCredentials _encryptingCredentials;
    private Collection<EncryptedKeyIdentifierClause> _externalEncryptedKeys;
    private Uri _format;
    private string _nameQualifier;
    private string _spNameQualifier;
    private string _spProvidedId;
    private string _value;

    // Methods
    public Saml2NameIdentifier(string name) : this(name, null)
    {
    }

    public Saml2NameIdentifier(string name, Uri format)
    {
        if (string.IsNullOrEmpty(name))
        {
            throw DiagnosticUtility.ExceptionUtility.ThrowHelperArgumentNull("name");
        }
        if ((null != format) && !format.IsAbsoluteUri)
        {
            throw DiagnosticUtility.ExceptionUtility.ThrowHelperArgument("format", SR.GetString("ID0013", new object[0]));
        }
        this._format = format;
        this._value = name;
        this._externalEncryptedKeys = new Collection<EncryptedKeyIdentifierClause>();
    }

    // Properties
    public EncryptingCredentials EncryptingCredentials
    {
        get
        {
            return this._encryptingCredentials;
        }
        set
        {
            this._encryptingCredentials = value;
        }
    }

    public Collection<EncryptedKeyIdentifierClause> ExternalEncryptedKeys
    {
        get
        {
            return this._externalEncryptedKeys;
        }
    }

    public Uri Format
    {
        get
        {
            return this._format;
        }
        set
        {
            if ((null != value) && !value.IsAbsoluteUri)
            {
                throw DiagnosticUtility.ExceptionUtility.ThrowHelperArgument("value", SR.GetString("ID0013", new object[0]));
            }
            this._format = value;
        }
    }

    public string NameQualifier
    {
        get
        {
            return this._nameQualifier;
        }
        set
        {
            this._nameQualifier = XmlUtil.NormalizeEmptyString(value);
        }
    }

    public string SPNameQualifier
    {
        get
        {
            return this._spNameQualifier;
        }
        set
        {
            this._spNameQualifier = XmlUtil.NormalizeEmptyString(value);
        }
    }

    public string SPProvidedId
    {
        get
        {
            return this._spProvidedId;
        }
        set
        {
            this._spProvidedId = XmlUtil.NormalizeEmptyString(value);
        }
    }

    public string Value
    {
        get
        {
            return this._value;
        }
        set
        {
            if (string.IsNullOrEmpty(value))
            {
                throw DiagnosticUtility.ExceptionUtility.ThrowHelperArgumentNull("value");
            }
            this._value = value;
        }
    }
}
}
