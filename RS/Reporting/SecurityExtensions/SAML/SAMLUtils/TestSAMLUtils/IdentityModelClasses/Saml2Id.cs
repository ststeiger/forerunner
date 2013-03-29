using System;
using System.Collections.Generic;
using System.Xml;
using System.Text;

namespace TestSAMLUtils
{
public class Saml2Id
{
    // Fields
    private string _value;

    // Methods
    public Saml2Id() : this(UniqueId.CreateRandomId())
    {
    }

    public Saml2Id(string value)
    {
        if (string.IsNullOrEmpty(value))
        {
            throw DiagnosticUtility.ExceptionUtility.ThrowHelperArgumentNull("value");
        }
        try
        {
            this._value = XmlConvert.VerifyNCName(value);
        }
        catch (XmlException exception)
        {
            throw DiagnosticUtility.ExceptionUtility.ThrowHelperError(new ArgumentException(SR.GetString("ID4128", new object[0]), "value", exception));
        }
    }

    public override bool Equals(object obj)
    {
        if (object.ReferenceEquals(this, obj))
        {
            return true;
        }
        Saml2Id id = obj as Saml2Id;
        return ((id != null) && StringComparer.Ordinal.Equals(this._value, id.Value));
    }

    public override int GetHashCode()
    {
        return this._value.GetHashCode();
    }

    public override string ToString()
    {
        return this._value;
    }

    // Properties
    public string Value
    {
        get
        {
            return this._value;
        }
    }
}
}
