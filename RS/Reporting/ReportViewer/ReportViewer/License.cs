using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Forerunner.SSRS.License
{
    internal class LicenseException : ApplicationException
    {
        #region methods
        internal LicenseException() : base() { }
        internal LicenseException(String msg) : base(msg) { }
        internal LicenseException(String msg, Exception inner) : base(msg, inner) { }
        #endregion  // methods
    }

    internal static class License
    {
        #region methods

        internal static void Init()
        {
            if (timeBomb == null || currentMachineId == null)
            {
                timeBomb = TimeBomb.LoadFromRegistry();
                currentMachineId = MachineId.CreateCurrentMachineId();
            }
        }

        internal static void ThrowIfNotValid()
        {
            try
            {
                Init();
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
