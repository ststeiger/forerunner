using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Text;

namespace TestSAMLUtils
{
    public class Saml2Subject
    {
        // Fields
        private Saml2NameIdentifier _nameId;
        private Collection<Saml2SubjectConfirmation> _subjectConfirmations;

        // Methods
        public Saml2Subject()
        {
            this._subjectConfirmations = new Collection<Saml2SubjectConfirmation>();
        }

        public Saml2Subject(Saml2NameIdentifier nameId)
        {
            this._subjectConfirmations = new Collection<Saml2SubjectConfirmation>();
            this._nameId = nameId;
        }

        public Saml2Subject(Saml2SubjectConfirmation subjectConfirmation)
        {
            this._subjectConfirmations = new Collection<Saml2SubjectConfirmation>();
            if (subjectConfirmation == null)
            {
                throw DiagnosticUtility.ExceptionUtility.ThrowHelperArgumentNull("subjectConfirmation");
            }
            this._subjectConfirmations.Add(subjectConfirmation);
        }

        // Properties
        public Saml2NameIdentifier NameId
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

        public Collection<Saml2SubjectConfirmation> SubjectConfirmations
        {
            get
            {
                return this._subjectConfirmations;
            }
        }
    }
}
