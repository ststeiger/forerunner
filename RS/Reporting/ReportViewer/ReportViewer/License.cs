using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using System.Xml.Serialization;
using Microsoft.Win32;
using System.Net;
using System.Security.Cryptography;

namespace Forerunner.SSR
{
    [XmlRoot()]
    public class MachineId
    {
        #region methods

        private MachineId()
        {
            cpuId = GetCPUId();
            motherBoardId = GetBaseBoardId();
            hostName = GetHostName();

            biosId = GetBIOSId();
            diskId = GetDiskId();
            videoId = GetVideoId();
            macId = GetMacId();
        }
        public static MachineId CreateCurrentMachineId()
        {
            MachineId machineId = new MachineId();
            return machineId;
        }
        public bool IsSame(MachineId machineId)
        {
            // TODO

            return true;
        }
        private static String GetHostName()
        {
            return Dns.GetHostName();
        }
        private static string identifier(string wmiClass, string wmiProperty)
        {
            string result = "";
            System.Management.ManagementClass mc = new System.Management.ManagementClass(wmiClass);
            System.Management.ManagementObjectCollection moc = mc.GetInstances();
            foreach (System.Management.ManagementObject mo in moc)
            {
                // First one only
                if (result == "")
                {
                    try
                    {
                        result = mo[wmiProperty].ToString();
                        break;
                    }
                    catch
                    {
                    }
                }
            }
            return result;
        }
        private static string identifier(string wmiClass, string wmiProperty, string wmiMustBeTrue)
        {
            string result = "";
            System.Management.ManagementClass mc = new System.Management.ManagementClass(wmiClass);
            System.Management.ManagementObjectCollection moc = mc.GetInstances();
            foreach (System.Management.ManagementObject mo in moc)
            {
                if (mo[wmiMustBeTrue].ToString() == "True")
                {
                    //Only get the first one
                    if (result == "")
                    {
                        try
                        {
                            result = mo[wmiProperty].ToString();
                            break;
                        }
                        catch
                        {
                        }
                    }
                }
            }
            return result;
        }
        private static string GetCPUId()
        {
            //Uses first CPU identifier available in order of preference
            //Don't get all identifiers, as it is very time consuming
            string retVal = identifier("Win32_Processor", "UniqueId");
            if (retVal == "") //If no UniqueID, use ProcessorID
            {
                retVal = identifier("Win32_Processor", "ProcessorId");
                if (retVal == "") //If no ProcessorId, use Name
                {
                    retVal = identifier("Win32_Processor", "Name");
                    if (retVal == "") //If no Name, use Manufacturer
                    {
                        retVal = identifier("Win32_Processor", "Manufacturer");
                    }
                    //Add clock speed for extra security
                    retVal += identifier("Win32_Processor", "MaxClockSpeed");
                }
            }
            return retVal;
        }
        private static string GetBIOSId()
        {
            return identifier("Win32_BIOS", "Manufacturer")
            + identifier("Win32_BIOS", "SMBIOSBIOSVersion")
            + identifier("Win32_BIOS", "IdentificationCode")
            + identifier("Win32_BIOS", "SerialNumber")
            + identifier("Win32_BIOS", "ReleaseDate")
            + identifier("Win32_BIOS", "Version");
        }
        private static string GetDiskId()
        {
            return identifier("Win32_DiskDrive", "Model")
            + identifier("Win32_DiskDrive", "Manufacturer")
            + identifier("Win32_DiskDrive", "Signature")
            + identifier("Win32_DiskDrive", "TotalHeads");
        }
        private static string GetBaseBoardId()
        {
            return identifier("Win32_BaseBoard", "Model")
            + identifier("Win32_BaseBoard", "Manufacturer")
            + identifier("Win32_BaseBoard", "Name")
            + identifier("Win32_BaseBoard", "SerialNumber");
        }
        private static string GetVideoId()
        {
            return identifier("Win32_VideoController", "DriverVersion")
            + identifier("Win32_VideoController", "Name");
        }
        private static string GetMacId()
        {
            return identifier("Win32_NetworkAdapterConfiguration", "MACAddress", "IPEnabled");
        }

        #endregion  // methods

        #region data

        [XmlElement()]
        public String cpuId;

        [XmlElement()]
        public String biosId;

        [XmlElement()]
        public String motherBoardId;

        [XmlElement()]
        public String diskId;

        [XmlElement()]
        public String videoId;

        [XmlElement()]
        public String macId;

        [XmlElement()]
        public String hostName;

        #endregion data
    }

    [XmlRoot()]
    public class TimeBomb
    {
        #region enums and constants

        public const String failKey = "reason";
        public enum FailReason
        {
            Expired,
            MachineMismatch,
            TimeBombMissing
        };


        // Time bomb grace period expressed in days
        private const int trialPeriod = 60;
        private const String forerunnerKey = "Forerunnersw";
        private const String timeBombName = "timebomb";

        #endregion types and static constants

        #region methods

        private TimeBomb() { }
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
            softwareKey.DeleteSubKey(TimeBomb.forerunnerKey, true);
        }
        public static TimeBomb LoadFromRegistry()
        {
            // Load the time bomb from the registry
            RegistryKey softwareKey = Registry.LocalMachine.OpenSubKey("SOFTWARE");
            RegistryKey forerunnerswKey = softwareKey.OpenSubKey(TimeBomb.forerunnerKey);

            if (forerunnerswKey == null)
            {
                LicenseException e = new LicenseException("Setup error - time bomb data not found");
                e.Data.Add(TimeBomb.failKey, FailReason.TimeBombMissing);
                throw e;
            }

            String timeBombString = (String)forerunnerswKey.GetValue(TimeBomb.timeBombName);

            if (timeBombString == null)
            {
                LicenseException e = new LicenseException("Setup error - time bomb data not found");
                e.Data.Add(TimeBomb.failKey, FailReason.TimeBombMissing);
                throw e;
            }

            // Deserialize the time bomb
            StringReader reader = new StringReader(timeBombString);
            XmlSerializer serializer = new XmlSerializer(typeof(TimeBomb));
            return (TimeBomb)serializer.Deserialize(reader);
        }
        public void SaveToRegistry()
        {
            // Serialize the time bomb
            StringBuilder sb = new StringBuilder();
            StringWriter writer = new StringWriter(sb);
            XmlSerializer serializer = new XmlSerializer(typeof(TimeBomb));
            serializer.Serialize(writer, this);

            // Save the time bomb to the registry
            RegistryKey softwareKey = Registry.LocalMachine.OpenSubKey("SOFTWARE", true);
            RegistryKey forerunnerswKey = softwareKey.CreateSubKey(TimeBomb.forerunnerKey);
            forerunnerswKey.SetValue(TimeBomb.timeBombName, sb.ToString(), RegistryValueKind.String);
            writer.Close();
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
        private static byte[] EncryptStringToBytes_Aes(string plainText, byte[] Key, byte[] IV)
        {
            byte[] encrypted;

            // Create an AesManaged object 
            // with the specified key and IV. 
            using (AesManaged aesAlg = new AesManaged())
            {
                aesAlg.Key = Key;
                aesAlg.IV = IV;

                // Create a decrytor to perform the stream transform.
                ICryptoTransform encryptor = aesAlg.CreateEncryptor(aesAlg.Key, aesAlg.IV);

                // Create the streams used for encryption. 
                using (MemoryStream msEncrypt = new MemoryStream())
                {
                    using (CryptoStream csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write))
                    {
                        using (StreamWriter swEncrypt = new StreamWriter(csEncrypt))
                        {

                            //Write all data to the stream.
                            swEncrypt.Write(plainText);
                        }
                        encrypted = msEncrypt.ToArray();
                    }
                }
            }

            // Return the encrypted bytes from the memory stream. 
            return encrypted;
        }
        private static string DecryptStringFromBytes_Aes(byte[] cipherText, byte[] Key, byte[] IV)
        {
            // Declare the string used to hold the decrypted text. 
            string plaintext = null;

            // Create an AesManaged object with the specified key and IV.
            using (AesManaged aesAlg = new AesManaged())
            {
                aesAlg.Key = Key;
                aesAlg.IV = IV;

                // Create a decrytor to perform the stream transform.
                ICryptoTransform decryptor = aesAlg.CreateDecryptor(aesAlg.Key, aesAlg.IV);

                // Create the streams used for decryption. 
                using (MemoryStream msDecrypt = new MemoryStream(cipherText))
                {
                    using (CryptoStream csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read))
                    {
                        using (StreamReader srDecrypt = new StreamReader(csDecrypt))
                        {

                            // Read the decrypted bytes from the decrypting stream and place them in a string.
                            plaintext = srDecrypt.ReadToEnd();
                        }
                    }
                }

            }
            return plaintext;
        }

        #endregion //methods

        #region data

        [XmlElement()]
        public DateTime start;         // Time Bomb Start date / time

        [XmlElement()]
        public MachineId machineId;    // Machine Id where the Time Bomb was created

        #endregion  // data
    }

    public class LicenseException : ApplicationException
    {
        public LicenseException() : base() {}
        public LicenseException(String msg) : base(msg) {}
    }

    static internal class License
    {
        #region methods

        public static void ThrowIfNotValid()
        {
            if (currentMachineId != null && timeBomb != null)
            {
                timeBomb.IsValid(currentMachineId);
            }

            timeBomb = TimeBomb.LoadFromRegistry();
            currentMachineId = MachineId.CreateCurrentMachineId();
            timeBomb.IsValid(currentMachineId);
        }
        
        #endregion

        #region data

        private static TimeBomb timeBomb = null;
        private static MachineId currentMachineId = null;
        
        #endregion

    }
}
