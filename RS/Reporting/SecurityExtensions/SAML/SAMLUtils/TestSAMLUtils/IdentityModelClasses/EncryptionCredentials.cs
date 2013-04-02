using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace TestSAMLUtils
{
public class EncryptingCredentials
{
    // Fields
    private string _algorithm;
    private SecurityKey _key;
    private SecurityKeyIdentifier _keyIdentifier;

    // Methods
    public EncryptingCredentials()
    {
    }

    public EncryptingCredentials(SecurityKey key, SecurityKeyIdentifier keyIdentifier, string algorithm)
    {
        if (key == null)
        {
            throw DiagnosticUtility.ExceptionUtility.ThrowHelperArgumentNull("key");
        }
        if (keyIdentifier == null)
        {
            throw DiagnosticUtility.ExceptionUtility.ThrowHelperArgumentNull("keyIdentifier");
        }
        if (string.IsNullOrEmpty(algorithm))
        {
            throw DiagnosticUtility.ExceptionUtility.ThrowHelperArgumentNull("algorithm");
        }
        this._algorithm = algorithm;
        this._key = key;
        this._keyIdentifier = keyIdentifier;
    }

    // Properties
    public string Algorithm
    {
        get
        {
            return this._algorithm;
        }
        set
        {
            if (string.IsNullOrEmpty(value))
            {
                throw DiagnosticUtility.ExceptionUtility.ThrowHelperArgumentNull("value");
            }
            this._algorithm = value;
        }
    }

    public SecurityKey SecurityKey
    {
        get
        {
            return this._key;
        }
        set
        {
            if (value == null)
            {
                throw DiagnosticUtility.ExceptionUtility.ThrowHelperArgumentNull("value");
            }
            this._key = value;
        }
    }

    public SecurityKeyIdentifier SecurityKeyIdentifier
    {
        get
        {
            return this._keyIdentifier;
        }
        set
        {
            if (value == null)
            {
                throw DiagnosticUtility.ExceptionUtility.ThrowHelperArgumentNull("value");
            }
            this._keyIdentifier = value;
        }
    }
}
}
