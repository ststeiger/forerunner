using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace TestSAMLUtils
{
    public class Saml2SubjectConfirmation
    {
        // Fields
        private Saml2SubjectConfirmationData _data;
        private Uri _method;
        private Saml2NameIdentifier _nameId;

        // Methods
        public Saml2SubjectConfirmation(Uri method)
            : this(method, null)
        {
        }

        public Saml2SubjectConfirmation(Uri method, Saml2SubjectConfirmationData data)
        {
            if (null == method)
            {
                throw new ArgumentNullException("method");
            }
            if (!method.IsAbsoluteUri)
            {
                throw new ArgumentException("method ID0013" + new object[0]);
            }
            this._method = method;
            this._data = data;
        }

        // Properties
        public Uri Method
        {
            get
            {
                return this._method;
            }
            set
            {
                if (null == value)
                {
                    throw DiagnosticUtility.ExceptionUtility.ThrowHelperArgumentNull("value");
                }
                if (!value.IsAbsoluteUri)
                {
                    throw DiagnosticUtility.ExceptionUtility.ThrowHelperArgument("value", SR.GetString("ID0013", new object[0]));
                }
                this._method = value;
            }
        }

        public Saml2NameIdentifier NameIdentifier
        {
            get
            {
                return this._nameId;
            }
            set
            {
                this._nameId = value;
            }
        }

        public Saml2SubjectConfirmationData SubjectConfirmationData
        {
            get
            {
                return this._data;
            }
            set
            {
                this._data = value;
            }
        }
    }
}
