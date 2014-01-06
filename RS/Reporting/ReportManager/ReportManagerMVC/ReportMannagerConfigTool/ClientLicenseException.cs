using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ForerunnerLicense
{
    public class ClientLicenseException : Exception
    {
        public ClientLicenseException(string errorMessage)
            : base(errorMessage)
        {
        }
    }
}
