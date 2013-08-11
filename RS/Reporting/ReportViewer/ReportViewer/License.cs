using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using System.Xml.Serialization;
using Microsoft.Win32;

namespace Forerunner.SSR
{
    [XmlRoot()]
    public class MachineId
    {
        private MachineId() { }

        public static MachineId CreateCurrentMachineId()
        {
            // TODO

            return new MachineId();
        }

        public bool IsSame(MachineId machineId)
        {
            // TODO

            return true;
        }
    }

    [XmlRoot()]
    public class TimeBomb
    {
        public static String FailKey
        {
            get
            {
                return "reason";
            }
        }

        public enum FailReason
        {
            Expired,
            MachineMismatch,
            TimeBombMissing
        };

        // Time bomb grace period expressed in days
        private static int trialPeriod = 60;
        private static String forerunnerKey = "Forerunnersw";
        private static String timeBombName = "timebomb";

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

        public static TimeBomb LoadFromRegistry()
        {
            // Load the time bomb from the registry
            RegistryKey softwareKey = Registry.LocalMachine.OpenSubKey("SOFTWARE");
            RegistryKey forerunnerswKey = softwareKey.OpenSubKey(TimeBomb.forerunnerKey);

            if (forerunnerswKey == null)
            {
                ApplicationException e = new ApplicationException("Setup error - time bomb data not found");
                e.Data.Add(TimeBomb.FailKey, FailReason.TimeBombMissing);
                throw e;
            }

            String timeBombString = (String)forerunnerswKey.GetValue(TimeBomb.timeBombName);

            if (timeBombString == null)
            {
                ApplicationException e = new ApplicationException("Setup error - time bomb data not found");
                e.Data.Add(TimeBomb.FailKey, FailReason.TimeBombMissing);
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
                ApplicationException e = new ApplicationException("The trial period has expired");
                e.Data.Add(TimeBomb.FailKey, FailReason.Expired);
                throw e;
            }

            if (!machineId.IsSame(currentMachineId))
            {
                // The TimeBomb must be created on the same machine
                ApplicationException e = new ApplicationException("Setup error - machine id mismatch");
                e.Data.Add(TimeBomb.FailKey, FailReason.MachineMismatch);
                throw e;
            }

            return true;
        }

        #endregion //methods

        #region data

        [XmlAttribute()]
        public DateTime start;         // Time Bomb Start date / time

        [XmlElement()]
        public MachineId machineId;    // Machine Id where the Time Bomb was created

        #endregion  // data
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

    }  // class License
}
