using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Text;

namespace TestSAMLUtils
{
    internal class IdentityProviderEntry
    {
        // Fields
        private Uri _location;
        private string _name;
        private Uri _providerId;

        // Methods
        public IdentityProviderEntry(Uri providerId)
        {
            this._providerId = ValidateProviderId(providerId);
        }

        private static Uri ValidateProviderId(Uri providerId)
        {
            if (null == providerId)
            {
                throw new ArgumentNullException("providerId");
            }
            return providerId;
        }

        // Properties
        public Uri Location
        {
            get
            {
                return this._location;
            }
            set
            {
                this._location = value;
            }
        }

        public string Name
        {
            get
            {
                return this._name;
            }
            set
            {
                this._name = SamlpUtil.EmptyToNull(value);
            }
        }

        public Uri ProviderId
        {
            get
            {
                return this._providerId;
            }
            set
            {
                this._providerId = ValidateProviderId(value);
            }
        }
    }

    internal class IdentityProviderCollection : Collection<IdentityProviderEntry>
    {
        // Fields
        private Uri _getComplete;

        // Properties
        public Uri GetComplete
        {
            get
            {
                return this._getComplete;
            }
            set
            {
                this._getComplete = value;
            }
        }
    }

    internal class Scoping
    {
        // Fields
        private IdentityProviderCollection _identityProviderList;
        private int? _proxyCount;
        private Collection<Uri> _requesterIds;

        // Methods
        public Scoping()
        {
            this._requesterIds = new Collection<Uri>();
            this._identityProviderList = new IdentityProviderCollection();
        }

        public Scoping(IdentityProviderCollection identityProviderList)
        {
            this._requesterIds = new Collection<Uri>();
            if (identityProviderList == null)
            {
                throw new ArgumentNullException("identityProviderList");
            }
            this._identityProviderList = identityProviderList;
        }

        // Properties
        public IdentityProviderCollection IdentityProviderList
        {
            get
            {
                return this._identityProviderList;
            }
        }

        public int? ProxyCount
        {
            get
            {
                return this._proxyCount;
            }
            set
            {
                if (value.HasValue && (value.Value < 0))
                {
                    throw new ArgumentOutOfRangeException(SR.GetString("MSIS0003", new object[0]));
                }
                this._proxyCount = value;
            }
        }

        public Collection<Uri> RequesterIds
        {
            get
            {
                return this._requesterIds;
            }
        }
    }
}
