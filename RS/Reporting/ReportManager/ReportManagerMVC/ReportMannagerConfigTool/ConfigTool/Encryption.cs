using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Collections;

namespace ReportMannagerConfigTool
{
    public class Encryption
    {
        private ICryptoTransform encryptor;
        private ICryptoTransform decryptor;
        private const int bufferSize = 1024;

        public Encryption(string algorithmName, string key)
        {
            SymmetricAlgorithm provider = SymmetricAlgorithm.Create(algorithmName);
            provider.Key = Encoding.UTF8.GetBytes(key);
            provider.IV = new byte[] { 0x76, 0xA4, 0xCA, 0xEA, 0x9E, 0xA3, 0x7A, 0x8C };

            encryptor = provider.CreateEncryptor();
            decryptor = provider.CreateDecryptor();
        }

        public Encryption(string key) : this("TripleDES", key) { }

        public string Encrypt(string clearText)
        {
            //create clear text stream
            byte[] clearBuffer = Encoding.UTF8.GetBytes(clearText);
            MemoryStream clearStream = new MemoryStream(clearBuffer);

            //create empty encrypted stream
            MemoryStream encryptedStream = new MemoryStream();

            //encrypt the clear stream into the encrypted stream
            CryptoStream cryptoStream = new CryptoStream(encryptedStream, encryptor, CryptoStreamMode.Write);

            int bytesRead = 0;
            byte[] buffer = new byte[bufferSize];
            do
            {
                bytesRead = clearStream.Read(buffer, 0, bufferSize);
                cryptoStream.Write(buffer, 0, bytesRead);
            } while (bytesRead > 0);


            cryptoStream.FlushFinalBlock();

            buffer = encryptedStream.ToArray();

            string encryptedText = Convert.ToBase64String(buffer);
            return encryptedText;
        }

        public string Decrypt(string encryptedText)
        {
            byte[] encryptedBuffer = Convert.FromBase64String(encryptedText);
            Stream encryptedStream = new MemoryStream(encryptedBuffer);

            MemoryStream clearStream = new MemoryStream();
            CryptoStream cryptoStream = new CryptoStream(encryptedStream, decryptor, CryptoStreamMode.Read);

            int bytesRead = 0;
            byte[] buffer = new byte[bufferSize];

            do
            {
                bytesRead = cryptoStream.Read(buffer, 0, bufferSize);
                clearStream.Write(buffer, 0, bytesRead);

            } while (bytesRead > 0);

            buffer = clearStream.GetBuffer();
            string clearText = Encoding.UTF8.GetString(buffer, 0, (int)clearStream.Length);
            return clearText;
        }

        public static string Encrypt(string clearText, string key)
        {
            Encryption encrypt = new Encryption(key);
            return encrypt.Encrypt(clearText);
        }

        public static string Decrypt(string encryptedText, string key)
        {
            try
            {
                Encryption encrypt = new Encryption(key);
                return encrypt.Decrypt(encryptedText);
            }
            catch
            {
                return encryptedText;
            }
        }
    }
}
