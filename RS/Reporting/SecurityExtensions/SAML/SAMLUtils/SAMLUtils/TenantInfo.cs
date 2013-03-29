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
        private bool isPost;
        public TenantInfo(AsymmetricAlgorithm key, Uri iDP)
        {
            this.key = key;
            this.iDP = iDP;
        }

        public bool IsPostBinding
        {
            get { return isPost;  }
            set { isPost = value; }
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
