using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Security;
using System.Xml.Serialization;
using System.Runtime.Serialization;
using System.Security.Cryptography;
using Microsoft.Win32;

namespace Forerunner.SSRS.License
{
    [DataContract()]
    public class TimeBomb
    {
        #region enums and constants

        public const String failKey = "reason";
        public enum FailReason
        {
            Expired,
            MachineMismatch,
            TimeBombMissing,
            SetupError
        };


        // Time bomb grace period expressed in days
        private const int trialPeriod = 60;
        private const String forerunnerKey = "Forerunnersw";
        private const String ssrKey = "ssr";
        private const String timeBombName = "setupdata";
        private const String machineHashName = "setupkey";
        private const String encryptKey = @"shskjhkjhgdfs56G54HJujkIfjte46KD";
        private const String encryptIV = @"jhlksdhlkjhglkjh";

        public const String genericRegistyError = "Setup error - time bomb not found or invalid";

        #endregion types and static constants

        #region methods

        public TimeBomb() { }
        public static TimeBomb Create(DateTime installDate)
        {
            TimeBomb timeBomb = new TimeBomb();
            timeBomb.start = installDate;
            timeBomb.machineId = MachineId.CreateCurrentMachineId();

            return timeBomb;
        }
        public static TimeBomb Create()
        {
            return TimeBomb.Create(DateTime.Now);
        }
        public static void Remove()
        {
            RegistryKey softwareKey = Registry.LocalMachine.OpenSubKey("SOFTWARE", true);
            RegistryKey forerunnerKey = softwareKey.OpenSubKey(TimeBomb.forerunnerKey, true);
            if (forerunnerKey != null)
            {
                forerunnerKey.DeleteSubKey(TimeBomb.ssrKey, false);
            }
        }
        public Byte[] Serialize()
        {
            MemoryStream stream = new MemoryStream();
            DataContractSerializer serializer = new DataContractSerializer(typeof(TimeBomb));
            serializer.WriteObject(stream, this);

            return stream.ToArray();
        }
        public void SaveToRegistry()
        {
            byte[] timeBomb = Serialize();

            MD5Cng md5 = new MD5Cng();
            byte[] machineHash = md5.ComputeHash(timeBomb);
            String cryptoHash = Convert.ToBase64String(machineHash.Take(8).ToArray());

            // Encrypt the string into a byte array
            ASCIIEncoding ascii = new ASCIIEncoding();
            byte[] timeBombProtected = EncryptAes(timeBomb, ascii.GetBytes(TimeBomb.encryptKey), ascii.GetBytes(TimeBomb.encryptIV));

            // Save the time bomb to the registry
            RegistryKey softwareKey = Registry.LocalMachine.OpenSubKey("SOFTWARE", true);
            RegistryKey forerunnerswKey = softwareKey.CreateSubKey(TimeBomb.forerunnerKey);
            RegistryKey ssrKey = forerunnerswKey.CreateSubKey(TimeBomb.ssrKey);
            ssrKey.SetValue(TimeBomb.timeBombName, timeBombProtected, RegistryValueKind.Binary);
            ssrKey.SetValue(TimeBomb.machineHashName, cryptoHash, RegistryValueKind.String);
        }
        public static TimeBomb LoadFromRegistry()
        {
            // Load the time bomb from the registry
            RegistryKey softwareKey = Registry.LocalMachine.OpenSubKey("SOFTWARE");
            RegistryKey forerunnerswKey = softwareKey.OpenSubKey(TimeBomb.forerunnerKey);
            if (forerunnerswKey == null)
            {
                LicenseException e = new LicenseException(TimeBomb.genericRegistyError);
                e.Data.Add(TimeBomb.failKey, FailReason.TimeBombMissing);
                throw e;
            }

            RegistryKey ssrKey = forerunnerswKey.OpenSubKey(TimeBomb.ssrKey);
            if (ssrKey == null)
            {
                LicenseException e = new LicenseException(TimeBomb.genericRegistyError);
                e.Data.Add(TimeBomb.failKey, FailReason.TimeBombMissing);
                throw e;
            }

            byte[] timeBombProtected = (byte[])ssrKey.GetValue(TimeBomb.timeBombName);

            if (timeBombProtected == null)
            {
                LicenseException e = new LicenseException(TimeBomb.genericRegistyError);
                e.Data.Add(TimeBomb.failKey, FailReason.TimeBombMissing);
                throw e;
            }

            // Decrypt the time bomb data
            ASCIIEncoding ascii = new ASCIIEncoding();
            byte[] timeBombData = DecryptAes(timeBombProtected, ascii.GetBytes(TimeBomb.encryptKey), ascii.GetBytes(TimeBomb.encryptIV));

            // Deserialize the time bomb
            MemoryStream stream = new MemoryStream(timeBombData);
            DataContractSerializer serializer = new DataContractSerializer(typeof(TimeBomb));
            return (TimeBomb)serializer.ReadObject(stream);
        }
        public static bool PreviouslyInstalled()
        {
            RegistryKey softwareKey = Registry.LocalMachine.OpenSubKey("SOFTWARE");
            RegistryKey forerunnerswKey = softwareKey.OpenSubKey(TimeBomb.forerunnerKey);
            if (forerunnerswKey == null)
            {
                return false;
            }

            RegistryKey ssrKey = forerunnerswKey.OpenSubKey(TimeBomb.ssrKey);
            if (ssrKey == null)
            {
                return false;
            }

            return true;
        }
        public bool IsValid(MachineId currentMachineId)
        {
            TimeSpan timeSpan = DateTime.Now.Subtract(start);
            if (timeSpan.Days > trialPeriod)
            {
                // Timebomb has expired, time to buy a license
                LicenseException e = new LicenseException("The trial period has expired");
                e.Data.Add(TimeBomb.failKey, FailReason.Expired);
                throw e;
            }

            if (!machineId.IsSame(currentMachineId))
            {
                // The TimeBomb must be created on the same machine
                LicenseException e = new LicenseException("Setup error - machine id mismatch");
                e.Data.Add(TimeBomb.failKey, FailReason.MachineMismatch);
                throw e;
            }

            return true;
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

        #region data

        [DataMember()]
        public DateTime start;          // Time Bomb Start date / time
        [DataMember()]
        public MachineId machineId;     // Machine Id where the Time Bomb was created

        #endregion  // data
    }
}
