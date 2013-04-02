using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace TestSAMLUtils
{
    internal abstract class SamlMessage
    {
        // Fields
        private Uri _consent = ConsentIdentifiers.Unspecified;
        private Uri _destination;
        private Saml2Id _id = new Saml2Id();
        private DateTime _issueInstant = DateTime.UtcNow;
        private Saml2NameIdentifier _issuer;
        private SigningCredentials _signingCredentials;
        private SecurityToken _signingToken;
        private string _version = "2.0";

        // Methods
        protected SamlMessage()
        {
        }

        // Properties
        public Uri Consent
        {
            get
            {
                return this._consent;
            }
            set
            {
                if (null == value)
                {
                    this._consent = ConsentIdentifiers.Unspecified;
                }
                else
                {
                    this._consent = value;
                }
            }
        }

        public Uri Destination
        {
            get
            {
                return this._destination;
            }
            set
            {
                this._destination = value;
            }
        }

        public Saml2Id Id
        {
            get
            {
                return this._id;
            }
            set
            {
                if (value == null)
                {
                    throw new ArgumentNullException("value");
                }
                this._id = value;
            }
        }

        public DateTime IssueInstant
        {
            get
            {
                return this._issueInstant;
            }
            set
            {
                if (value.Kind == DateTimeKind.Unspecified)
                {
                    throw new ArgumentException(SR.GetString("MSIS0000", new object[0]), "value");
                }
                this._issueInstant = value.ToUniversalTime();
            }
        }

        public Saml2NameIdentifier Issuer
        {
            get
            {
                return this._issuer;
            }
            set
            {
                this._issuer = value;
            }
        }

        public SigningCredentials SigningCredentials
        {
            get
            {
                return this._signingCredentials;
            }
            set
            {
                this._signingCredentials = value;
            }
        }

        public SecurityToken SigningToken
        {
            get
            {
                return this._signingToken;
            }
            set
            {
                this._signingToken = value;
            }
        }

        public string Version
        {
            get
            {
                return this._version;
            }
        }
    }
}
