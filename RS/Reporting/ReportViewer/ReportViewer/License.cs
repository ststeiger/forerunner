﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Forerunner.SSRS.Security
{
    internal class LicenseException : ApplicationException
    {
        #region constants

        internal const String failKey = "reason";

        internal enum FailReason
        {
            Expired,
            MachineMismatch,
            TimeBombMissing,
            SetupError
        };
        #endregion constants

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
            try
            {
                if (timeBomb == null || currentMachineId == null)
                {
                    timeBomb = TimeBomb.LoadFromRegistry();
                    currentMachineId = MachineId.CreateCurrentMachineId();

                    isSameMachine = timeBomb.IsSameMachine(currentMachineId);
                }
            }
            catch (System.Management.ManagementException /*e*/)
            {
                // We will assume same machine for this exception and simply reply on the timebomb
                // date check. This can happen if the user does not have full trust.
                isSameMachine = true;
            }
            catch (Exception e)
            {
                LicenseException licenseException = new LicenseException(TimeBomb.genericRegistyError, e);
                licenseException.Data.Add(LicenseException.failKey, LicenseException.FailReason.SetupError);
                throw licenseException;
            }
        }

        internal static void ThrowIfNotValid()
        {
            Init();
            if (!timeBomb.IsValid())
            {
                // Timebomb has expired, time to buy a license
                LicenseException e = new LicenseException("The trial period has expired");
                e.Data.Add(LicenseException.failKey, LicenseException.FailReason.Expired);
                throw e;
            }

            if (!isSameMachine)
            {
                // The TimeBomb must be created on the same machine
                LicenseException e = new LicenseException("Setup error - machine id mismatch");
                e.Data.Add(LicenseException.failKey, LicenseException.FailReason.MachineMismatch);
                throw e;
            }
        }

        #endregion

        #region data

        private static TimeBomb timeBomb = null;
        private static MachineId currentMachineId = null;
        private static bool isSameMachine = true;

        #endregion
    }
}
