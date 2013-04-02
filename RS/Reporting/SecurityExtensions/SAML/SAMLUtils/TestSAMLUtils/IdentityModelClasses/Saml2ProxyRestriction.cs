using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Text;

namespace TestSAMLUtils
{
    internal class AbsoluteUriCollection : Collection<Uri>
    {
        // Methods
        protected override void InsertItem(int index, Uri item)
        {
            if ((null == item) || !item.IsAbsoluteUri)
            {
                throw DiagnosticUtility.ExceptionUtility.ThrowHelperArgument("item", SR.GetString("ID0013", new object[0]));
            }
            base.InsertItem(index, item);
        }

        protected override void SetItem(int index, Uri item)
        {
            if ((null == item) || !item.IsAbsoluteUri)
            {
                throw DiagnosticUtility.ExceptionUtility.ThrowHelperArgument("item", SR.GetString("ID0013", new object[0]));
            }
            base.SetItem(index, item);
        }
    }

    public class Saml2ProxyRestriction
    {
        // Fields
        private Collection<Uri> _audiences = new AbsoluteUriCollection();
        private int? _count;

        // Properties
        public Collection<Uri> Audiences
        {
            get
            {
                return this._audiences;
            }
        }

        public int? Count
        {
            get
            {
                return this._count;
            }
            set
            {
                if (value.HasValue && (value.Value < 0))
                {
                    throw new ArgumentOutOfRangeException("value ID0002" + new object[0]);
                }
                this._count = value;
            }
        }
    }
}
