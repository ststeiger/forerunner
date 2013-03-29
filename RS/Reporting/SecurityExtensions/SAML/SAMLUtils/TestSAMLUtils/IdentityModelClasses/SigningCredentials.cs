using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace TestSAMLUtils
{
public class SigningCredentials
{
    // Fields
    private string digestAlgorithm;
    private string signatureAlgorithm;
    private SecurityKey signingKey;
    private SecurityKeyIdentifier signingKeyIdentifier;

    // Methods
    public SigningCredentials(SecurityKey signingKey, string signatureAlgorithm, string digestAlgorithm) : this(signingKey, signatureAlgorithm, digestAlgorithm, null)
    {
    }

    public SigningCredentials(SecurityKey signingKey, string signatureAlgorithm, string digestAlgorithm, SecurityKeyIdentifier signingKeyIdentifier)
    {
        if (signingKey == null)
        {
            throw new ArgumentNullException("signingKey");
        }
        if (signatureAlgorithm == null)
        {
            throw new ArgumentNullException("signatureAlgorithm");
        }
        if (digestAlgorithm == null)
        {
            throw new ArgumentNullException("digestAlgorithm");
        }
        this.signingKey = signingKey;
        this.signatureAlgorithm = signatureAlgorithm;
        this.digestAlgorithm = digestAlgorithm;
        this.signingKeyIdentifier = signingKeyIdentifier;
    }

    // Properties
    public string DigestAlgorithm
    {
        get
        {
            return this.digestAlgorithm;
        }
    }

    public string SignatureAlgorithm
    {
        get
        {
            return this.signatureAlgorithm;
        }
    }

    public SecurityKey SigningKey
    {
        get
        {
            return this.signingKey;
        }
    }

    public SecurityKeyIdentifier SigningKeyIdentifier
    {
        get
        {
            return this.signingKeyIdentifier;
        }
    }
}
}
