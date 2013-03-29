using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Text;

namespace TestSAMLUtils
{
    public class Saml2SubjectConfirmationData
    {
        // Fields
        private string _address;
        private Saml2Id _inResponseTo;
        private Collection<SecurityKeyIdentifier> _keyIdentifiers = new Collection<SecurityKeyIdentifier>();
        private DateTime? _notBefore;
        private DateTime? _notOnOrAfter;
        private Uri _recipient;

        // Properties
        public string Address
        {
            get
            {
                return this._address;
            }
            set
            {
                this._address = XmlUtil.NormalizeEmptyString(value);
            }
        }

        public Saml2Id InResponseTo
        {
            get
            {
                return this._inResponseTo;
            }
            set
            {
                this._inResponseTo = value;
            }
        }

        public Collection<SecurityKeyIdentifier> KeyIdentifiers
        {
            get
            {
                return this._keyIdentifiers;
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
                this._notBefore = DateTimeUtil.ToUniversalTime(value);
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
                this._notOnOrAfter = DateTimeUtil.ToUniversalTime(value);
            }
        }

        public Uri Recipient
        {
            get
            {
                return this._recipient;
            }
            set
            {
                if ((null != value) && !value.IsAbsoluteUri)
                {
                    throw new ArgumentException("value" + " ID0013" + new object[0]);
                }
                this._recipient = value;
            }
        }
    }
}
