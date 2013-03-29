using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace TestSAMLUtils
{
internal class NameIdentifierPolicy
{
    // Fields
    private bool _allowCreate;
    private Uri _format = NameIdentifierFormats.Unspecified;
    private string _spNameQualifier;

    // Properties
    public bool AllowCreate
    {
        get
        {
            return this._allowCreate;
        }
        set
        {
            this._allowCreate = value;
        }
    }

    public Uri Format
    {
        get
        {
            return this._format;
        }
        set
        {
            if (null == value)
            {
                this._format = NameIdentifierFormats.Unspecified;
            }
            else
            {
                this._format = value;
            }
        }
    }

    public string SPNameQualifier
    {
        get
        {
            return this._spNameQualifier;
        }
        set
        {
            // CHANGED
            this._spNameQualifier = value == "" ? null : value;
        }
    }
}
}
