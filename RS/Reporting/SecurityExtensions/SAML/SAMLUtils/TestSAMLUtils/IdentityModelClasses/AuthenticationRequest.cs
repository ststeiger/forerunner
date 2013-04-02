using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace TestSAMLUtils
{
internal class AuthenticationRequest : SamlRequest
{
    // Fields
    private int? _assertionConsumerServiceIndex;
    private Uri _assertionConsumerServiceUrl;
    private int? _attributeConsumingServiceIndex;
    private Saml2Conditions _conditions;
    private bool _forceAuthentication;
    private bool _isPassive;
    private NameIdentifierPolicy _nameIdentifierPolicy;
    private Uri _protocolBinding;
    private string _providerName;
    private RequestedAuthenticationContext _requestedAuthenticationContext;
    private Scoping _scoping;
    private Saml2Subject _subject;

    // Methods
    private static int? ValidateIndex(int? value)
    {
        if (value.HasValue && ((value < 0) || (value > 0xffff)))
        {
            throw new ArgumentOutOfRangeException("value MSIS0002" + new object[0]);
        }
        return value;
    }

    // Properties
    public int? AssertionConsumerServiceIndex
    {
        get
        {
            return this._assertionConsumerServiceIndex;
        }
        set
        {
            if (value.HasValue && ((null != this._protocolBinding) || (null != this._assertionConsumerServiceUrl)))
            {
                throw new InvalidOperationException(SR.GetString("MSIS0013", new object[0]));
            }
            this._assertionConsumerServiceIndex = ValidateIndex(value);
        }
    }

    public Uri AssertionConsumerServiceUrl
    {
        get
        {
            return this._assertionConsumerServiceUrl;
        }
        set
        {
            if ((null != value) && this._assertionConsumerServiceIndex.HasValue)
            {
                throw new InvalidOperationException(SR.GetString("MSIS0015", new object[0]));
            }
            this._assertionConsumerServiceUrl = value;
        }
    }

    public int? AttributeConsumingServiceIndex
    {
        get
        {
            return this._attributeConsumingServiceIndex;
        }
        set
        {
            this._attributeConsumingServiceIndex = ValidateIndex(value);
        }
    }

    public Saml2Conditions Conditions
    {
        get
        {
            return this._conditions;
        }
        set
        {
            this._conditions = value;
        }
    }

    public bool ForceAuthentication
    {
        get
        {
            return this._forceAuthentication;
        }
        set
        {
            this._forceAuthentication = value;
        }
    }

    public bool IsPassive
    {
        get
        {
            return this._isPassive;
        }
        set
        {
            this._isPassive = value;
        }
    }

    public NameIdentifierPolicy NameIdentifierPolicy
    {
        get
        {
            return this._nameIdentifierPolicy;
        }
        set
        {
            this._nameIdentifierPolicy = value;
        }
    }

    public Uri ProtocolBinding
    {
        get
        {
            return this._protocolBinding;
        }
        set
        {
            if ((null != value) && this._assertionConsumerServiceIndex.HasValue)
            {
                throw new InvalidOperationException(SR.GetString("MSIS0014", new object[0]));
            }
            this._protocolBinding = value;
        }
    }

    public string ProviderName
    {
        get
        {
            return this._providerName;
        }
        set
        {
            this._providerName = SamlpUtil.EmptyToNull(value);
        }
    }

    public RequestedAuthenticationContext RequestedAuthenticationContext
    {
        get
        {
            return this._requestedAuthenticationContext;
        }
        set
        {
            this._requestedAuthenticationContext = value;
        }
    }

    public Scoping Scoping
    {
        get
        {
            return this._scoping;
        }
        set
        {
            this._scoping = value;
        }
    }

    public Saml2Subject Subject
    {
        get
        {
            return this._subject;
        }
        set
        {
            this._subject = value;
        }
    }
}
}
