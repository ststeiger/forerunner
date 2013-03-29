using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Text;

namespace TestSAMLUtils
{

    public enum AuthenticationContextComparisonType
    {
        Exact,
        Minimum,
        Maximum,
        Better
    }

    internal enum AuthenticationContextReferenceType
    {
        Class,
        Declaration
    }

  
public class RequestedAuthenticationContext
{
    // Fields
    private AuthenticationContextComparisonType _comparison;
    private Collection<Uri> _references = new Collection<Uri>();
    private AuthenticationContextReferenceType _referenceType;

    // Properties
    public AuthenticationContextComparisonType Comparison
    {
        get
        {
            return this._comparison;
        }
        set
        {
            if ((value < AuthenticationContextComparisonType.Exact) || (value > AuthenticationContextComparisonType.Better))
            {
                throw new ArgumentOutOfRangeException("value");
            }
            this._comparison = value;
        }
    }

    public Collection<Uri> References
    {
        get
        {
            return this._references;
        }
    }

    internal AuthenticationContextReferenceType ReferenceType
    {
        get
        {
            return this._referenceType;
        }
        set
        {
            if ((value != AuthenticationContextReferenceType.Class) && (value != AuthenticationContextReferenceType.Declaration))
            {
                throw new ArgumentOutOfRangeException("value");
            }
            this._referenceType = value;
        }
    }
}
}
