using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Forerunner.SSR.Core
{
    public class LicenseException : ApplicationException
    {
        #region methods
        public LicenseException() : base() { }
        public LicenseException(String msg) : base(msg) { }
        public LicenseException(String msg, Exception inner) : base(msg, inner) { }
        #endregion  // methods
    }

    static public class License
    {
        #region methods

        public static void ThrowIfNotValid()
        {
            try
            {
                if (currentMachineId != null && timeBomb != null)
                {
                    timeBomb.IsValid(currentMachineId);
                }

                timeBomb = TimeBomb.LoadFromRegistry();
                currentMachineId = MachineId.CreateCurrentMachineId();
                timeBomb.IsValid(currentMachineId);
            }
            catch (Exception e)
            {
                LicenseException licenseException = new LicenseException(TimeBomb.genericRegistyError, e);
                licenseException.Data.Add(TimeBomb.failKey, TimeBomb.FailReason.SetupError);
                throw licenseException;
            }
        }

        #endregion

        #region data

        private static TimeBomb timeBomb = null;
        private static MachineId currentMachineId = null;

        #endregion

    }
}
