using System;
using System.Security.Cryptography;

namespace ForeRunner.Reporting.Extensions.SAMLUtils
{
    /// <summary>
    /// This class stores the key and IDP Uri for a tenant
    /// </summary>
    public class TenantInfo
    {
        private AsymmetricAlgorithm key;
        private Uri iDP;
        public TenantInfo(AsymmetricAlgorithm key, Uri iDP)
        {
            this.key = key;
            this.iDP = iDP;
        }

        public AsymmetricAlgorithm Key
        {
            get
            {
                return key;
            }
        }

        public Uri IDP
        {
            get
            {
                return iDP;
            }
        }
    }
}
