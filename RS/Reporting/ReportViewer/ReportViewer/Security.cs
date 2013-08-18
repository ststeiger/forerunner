using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Security.Cryptography;

namespace Forerunner.SSRS
{
    internal static class Security
    {
        #region constants

        private const String encryptKey = @"shskjhkjhgdfs56G54HJujkIfjte46KD";
        private const String encryptIV = @"jhlksdhlkjhglkjh";

        #endregion  // constants

        #region methods

        internal static String Encrypt(String text)
        {
            ASCIIEncoding ascii = new ASCIIEncoding();
            return Convert.ToBase64String(Encrypt(ascii.GetBytes(text)));
        }

        internal static byte[] Encrypt(byte[] buffer)
        {
            ASCIIEncoding ascii = new ASCIIEncoding();
            return EncryptAes(buffer, ascii.GetBytes(encryptKey), ascii.GetBytes(encryptIV));
        }

        private static byte[] EncryptAes(byte[] buffer, byte[] Key, byte[] IV)
        {
            byte[] encrypted;

            // Create an AesManaged object with the specified key and IV. 
            using (AesManaged aesAlg = new AesManaged())
            {
                aesAlg.Key = Key;
                aesAlg.IV = IV;

                // Create the streams used for encryption. 
                using (MemoryStream msEncrypt = new MemoryStream())
                {
                    using (CryptoStream csEncrypt = new CryptoStream(msEncrypt, aesAlg.CreateEncryptor(), CryptoStreamMode.Write))
                    {
                        csEncrypt.Write(buffer, 0, buffer.Length);
                    }
                    encrypted = msEncrypt.ToArray();
                }
            }

            // Return the encrypted bytes from the memory stream. 
            return encrypted;
        }

        internal static String Decrypt(String encryptedText)
        {
            byte[] buffer = Convert.FromBase64String(encryptedText);
            return Encoding.UTF8.GetString(Decrypt(buffer));
        }

        internal static byte[] Decrypt(byte[] encryptedBuffer)
        {
            ASCIIEncoding ascii = new ASCIIEncoding();
            return DecryptAes(encryptedBuffer, ascii.GetBytes(encryptKey), ascii.GetBytes(encryptIV));
        }

        private static byte[] DecryptAes(byte[] cipherText, byte[] Key, byte[] IV)
        {
            // Declare the string used to hold the decrypted text. 
            byte[] buffer = null;

            // Create an AesManaged object with the specified key and IV.
            using (AesManaged aesAlg = new AesManaged())
            {
                aesAlg.Key = Key;
                aesAlg.IV = IV;

                // Create the streams used for decryption. 
                using (MemoryStream msDecrypt = new MemoryStream())
                {
                    using (CryptoStream csDecrypt = new CryptoStream(msDecrypt, aesAlg.CreateDecryptor(), CryptoStreamMode.Write))
                    {
                        csDecrypt.Write(cipherText, 0, cipherText.Length);
                    }
                    buffer = msDecrypt.ToArray();
                }
            }
            return buffer;
        }

        #endregion //methods
    }
}
