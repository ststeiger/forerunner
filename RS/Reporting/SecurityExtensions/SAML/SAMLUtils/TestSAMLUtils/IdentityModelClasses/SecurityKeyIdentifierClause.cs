using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace TestSAMLUtils
{
public abstract class SecurityKeyIdentifierClause
{
    // Fields
    private readonly string clauseType;
    private int derivationLength;
    private byte[] derivationNonce;
    private string id;

    // Methods
    protected SecurityKeyIdentifierClause(string clauseType) : this(clauseType, null, 0)
    {
    }

    protected SecurityKeyIdentifierClause(string clauseType, byte[] nonce, int length)
    {
        this.clauseType = clauseType;
        this.derivationNonce = nonce;
        this.derivationLength = length;
    }

    public virtual SecurityKey CreateKey()
    {
        throw DiagnosticUtility.ExceptionUtility.ThrowHelperError(new NotSupportedException(SR.GetString("KeyIdentifierClauseDoesNotSupportKeyCreation")));
    }

    public byte[] GetDerivationNonce()
    {
        if (this.derivationNonce == null)
        {
            return null;
        }
        return (byte[]) this.derivationNonce.Clone();
    }

    public virtual bool Matches(SecurityKeyIdentifierClause keyIdentifierClause)
    {
        return object.ReferenceEquals(this, keyIdentifierClause);
    }

    // Properties
    public virtual bool CanCreateKey
    {
        get
        {
            return false;
        }
    }

    public string ClauseType
    {
        get
        {
            return this.clauseType;
        }
    }

    public int DerivationLength
    {
        get
        {
            return this.derivationLength;
        }
    }

    public string Id
    {
        get
        {
            return this.id;
        }
        set
        {
            this.id = value;
        }
    }
}
}
