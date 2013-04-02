using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Text;

namespace TestSAMLUtils
{
public class Saml2AudienceRestriction
{
    // Fields
    private Collection<Uri> _audiences;

    // Methods
    public Saml2AudienceRestriction()
    {
        this._audiences = new Collection<Uri>();
    }

    public Saml2AudienceRestriction(Uri audience) : this(new Uri[] { audience })
    {
    }

    public Saml2AudienceRestriction(IEnumerable<Uri> audiences)
    {
        this._audiences = new Collection<Uri>();
        if (audiences == null)
        {
            throw new ArgumentNullException("audiences");
        }
        foreach (Uri uri in audiences)
        {
            if (null == uri)
            {
                throw new ArgumentNullException("audiences");
            }
            this._audiences.Add(uri);
        }
    }

    // Properties
    public Collection<Uri> Audiences
    {
        get
        {
            return this._audiences;
        }
    }
}
}
