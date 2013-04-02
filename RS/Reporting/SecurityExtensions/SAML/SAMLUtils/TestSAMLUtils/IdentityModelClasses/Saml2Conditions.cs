using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Text;

namespace TestSAMLUtils
{
public class Saml2Conditions
{
    // Fields
    private Collection<Saml2AudienceRestriction> _audienceRestrictions = new Collection<Saml2AudienceRestriction>();
    private DateTime? _notBefore;
    private DateTime? _notOnOrAfter;
    private bool _oneTimeUse;
    private Saml2ProxyRestriction _proxyRestriction;

    // Properties
    public Collection<Saml2AudienceRestriction> AudienceRestrictions
    {
        get
        {
            return this._audienceRestrictions;
        }
    }

    public DateTime? NotBefore
    {
        get
        {
            return this._notBefore;
        }
        set
        {
            value = DateTimeUtil.ToUniversalTime(value);
            if ((value.HasValue && this._notOnOrAfter.HasValue) && (value.Value >= this._notOnOrAfter.Value))
            {
                throw DiagnosticUtility.ExceptionUtility.ThrowHelperArgument("value", SR.GetString("ID4116", new object[0]));
            }
            this._notBefore = value;
        }
    }

    public DateTime? NotOnOrAfter
    {
        get
        {
            return this._notOnOrAfter;
        }
        set
        {
            value = DateTimeUtil.ToUniversalTime(value);
            if ((value.HasValue && this._notBefore.HasValue) && (value.Value <= this._notBefore.Value))
            {
                throw DiagnosticUtility.ExceptionUtility.ThrowHelperArgument("value", SR.GetString("ID4116", new object[0]));
            }
            this._notOnOrAfter = value;
        }
    }

    public bool OneTimeUse
    {
        get
        {
            return this._oneTimeUse;
        }
        set
        {
            this._oneTimeUse = value;
        }
    }

    public Saml2ProxyRestriction ProxyRestriction
    {
        get
        {
            return this._proxyRestriction;
        }
        set
        {
            this._proxyRestriction = value;
        }
    }
}
}
