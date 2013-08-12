using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Security;
using System.Xml.Serialization;
using System.Runtime.Serialization.Formatters.Binary;
using System.Security.Cryptography;
using Microsoft.Win32;

namespace Forerunner.SSR.Core
{
    [Serializable()]
    [XmlRoot()]
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
        private const String EncryptPurpose = "K34khron56sTg";

        public const String genericRegistyError = "Setup error - time bomb data not found";

        #endregion types and static constants

        #region methods

        private TimeBomb() { }
        public static TimeBomb Create(DateTime installDate)
        {
            TimeBomb timeBomb = new TimeBomb();
            timeBomb.start = installDate;
            timeBomb.machineId = MachineId.CreateCurrentMachineId();
            timeBomb.CreateCryptoHash();

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
        private MemoryStream Serialize()
        {
            // Serialize the time bomb
            MemoryStream stream = new MemoryStream();
            BinaryFormatter serializer = new BinaryFormatter();
            serializer.Serialize(stream, this);
            return stream;
        }
        private void CreateCryptoHash()
        {
            MemoryStream stream = Serialize();

            // Create an 8 byte, cryptographic hash and convert it to a base 64 string from the unencrypted
            // serializer stream of this object. This will give us a 12 character string.
            MD5Cng md5 = new MD5Cng();
            byte[] machineHash = md5.ComputeHash(stream);
            cryptoHash = Convert.ToBase64String(machineHash.Take(8).ToArray());
        }
        public void SaveToRegistry()
        {
            // Serialize the time bomb
            MemoryStream stream = Serialize();

            // Encrypt the string into a byte array
            byte[] timeBombProtected = MachineKey.Protect(stream.GetBuffer(), TimeBomb.EncryptPurpose);

            // Save the time bomb to the registry
            RegistryKey softwareKey = Registry.LocalMachine.OpenSubKey("SOFTWARE", true);
            RegistryKey forerunnerswKey = softwareKey.CreateSubKey(TimeBomb.forerunnerKey);
            RegistryKey ssrKey = forerunnerswKey.CreateSubKey(TimeBomb.ssrKey);
            ssrKey.SetValue(TimeBomb.timeBombName, timeBombProtected, RegistryValueKind.Binary);
            ssrKey.SetValue(TimeBomb.machineHashName, cryptoHash, RegistryValueKind.String);
            stream.Close();
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
            byte[] timeBombData = MachineKey.Unprotect(timeBombProtected, TimeBomb.EncryptPurpose);

            // Deserialize the time bomb
            MemoryStream stream = new MemoryStream(timeBombData);
            BinaryFormatter serializer = new BinaryFormatter();
            return (TimeBomb)serializer.Deserialize(stream);
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

        #endregion //methods

        #region data

        [XmlElement()]
        public DateTime start;          // Time Bomb Start date / time
        [XmlElement()]
        public MachineId machineId;     // Machine Id where the Time Bomb was created
        [XmlElement()]
        public String cryptoHash;       // Cryptographic hash string

        #endregion  // data
    }
}
