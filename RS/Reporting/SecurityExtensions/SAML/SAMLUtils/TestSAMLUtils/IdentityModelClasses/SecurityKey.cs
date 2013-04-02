using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace TestSAMLUtils
{
    public abstract class SecurityKey
    {
        // Methods
        protected SecurityKey()
        {
        }

        public abstract byte[] DecryptKey(string algorithm, byte[] keyData);
        public abstract byte[] EncryptKey(string algorithm, byte[] keyData);
        public abstract bool IsAsymmetricAlgorithm(string algorithm);
        public abstract bool IsSupportedAlgorithm(string algorithm);
        public abstract bool IsSymmetricAlgorithm(string algorithm);

        // Properties
        public abstract int KeySize { get; }
    }
}
