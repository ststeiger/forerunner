using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace TestSAMLUtils
{
public abstract class BinaryKeyIdentifierClause : SecurityKeyIdentifierClause
{
    // Fields
    private readonly byte[] identificationData;

    // Methods
    protected BinaryKeyIdentifierClause(string clauseType, byte[] identificationData, bool cloneBuffer) : this(clauseType, identificationData, cloneBuffer, null, 0)
    {
    }

    protected BinaryKeyIdentifierClause(string clauseType, byte[] identificationData, bool cloneBuffer, byte[] derivationNonce, int derivationLength) : base(clauseType, derivationNonce, derivationLength)
    {
        if (identificationData == null)
        {
            throw new ArgumentNullException("identificationData");
        }
        if (identificationData.Length == 0)
        {
            throw new ArgumentOutOfRangeException("identificationData LengthMustBeGreaterThanZero");
        }
        if (cloneBuffer)
        {
            this.identificationData = SecurityUtils.CloneBuffer(identificationData);
        }
        else
        {
            this.identificationData = identificationData;
        }
    }

    public byte[] GetBuffer()
    {
        return SecurityUtils.CloneBuffer(this.identificationData);
    }

    protected byte[] GetRawBuffer()
    {
        return this.identificationData;
    }

    public override bool Matches(SecurityKeyIdentifierClause keyIdentifierClause)
    {
        BinaryKeyIdentifierClause objB = keyIdentifierClause as BinaryKeyIdentifierClause;
        return (object.ReferenceEquals(this, objB) || ((objB != null) && objB.Matches(this.identificationData)));
    }

    public bool Matches(byte[] data)
    {
        return this.Matches(data, 0);
    }

    public bool Matches(byte[] data, int offset)
    {
        if (offset < 0)
        {
            throw new ArgumentOutOfRangeException("offset valueMustBeNonNegative");
        }
        return SecurityUtils.MatchesBuffer(this.identificationData, 0, data, offset);
    }

    internal string ToBase64String()
    {
        return Convert.ToBase64String(this.identificationData);
    }

    internal string ToHexString()
    {
        return "";
        //return new SoapHexBinary(this.identificationData).ToString();
    }
}
}
