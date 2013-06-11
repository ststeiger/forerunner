using System;
using System.Collections.Generic;
using System.Security.Principal;
using System.Runtime.InteropServices;

namespace Forerunner.Security
{
    public class Impersonator : IDisposable
    {
        #region Declarations
        private readonly string username;
        private readonly string password;
        private readonly string domain;
        // this will hold the security context 
        // for reverting back to the client after
        // impersonation operations are complete
        private WindowsImpersonationContext impersonationContext;
        #endregion Declarations

        #region Constructors

        public Impersonator(string UserName,
            string Domain, string Password)
        {
            username = UserName;
            domain = Domain;
            password = Password;
        }
        #endregion Constructors

        #region Public Methods
        public static Impersonator Impersonate(
            string userName, string domain, string password)
        {
            var imp = new Impersonator(userName, domain, password);
            imp.Impersonate();
            return imp;
        }
        public void Impersonate()
        { impersonationContext = Logon().Impersonate(); }
        public void Undo() { impersonationContext.Undo(); }
        #endregion Public Methods

        #region Private Methods
        private WindowsIdentity Logon()
        {
            var handle = IntPtr.Zero;

            const int LOGON32_LOGON_NETWORK = 3;
            const int LOGON32_PROVIDER_DEFAULT = 0;
            const int SecurityImpersonation = 2;

            // attempt to authenticate domain user account
            try
            {
                if (!LogonUser(username, domain,
                    password, LOGON32_LOGON_NETWORK,
                    LOGON32_PROVIDER_DEFAULT, ref handle))
                    throw new ApplicationException(
                        "User logon failed. Error Number: " +
                        Marshal.GetLastWin32Error());

                // ----------------------------------
                var dupHandle = IntPtr.Zero;
                if (!DuplicateToken(handle,
                    SecurityImpersonation,
                    ref dupHandle))
                    throw new ApplicationException(
                        "Logon failed attemting to duplicate handle");
                // Logon Succeeded ! return new WindowsIdentity instance
                return (new WindowsIdentity(handle));
            }
            // close the open handle to the authenticated account
            finally { CloseHandle(handle); }
        }

        #region external Win32 API functions
        [DllImport("advapi32.dll", SetLastError = true)]
        private static extern bool
            LogonUser(string lpszUsername, string lpszDomain,
                    string lpszPassword, int dwLogonType,
                    int dwLogonProvider, ref IntPtr phToken);
        [DllImport("kernel32.dll", CharSet = CharSet.Auto)]
        private static extern bool CloseHandle(IntPtr handle);
        // --------------------------------------------

        [DllImport("advapi32.dll", CharSet = CharSet.Auto,
             SetLastError = true)]
        public static extern bool DuplicateToken(
            IntPtr ExistingTokenHandle,
            int SECURITY_IMPERSONATION_LEVEL,
            ref IntPtr DuplicateTokenHandle);
        // --------------------------------------------
        #endregion external Win32 API functions
        #endregion Private Methods

        #region IDisposable
        private bool disposed;
        public void Dispose() { Dispose(true); }
        public void Dispose(bool isDisposing)
        {
            if (disposed) return;
            if (isDisposing) Undo();
            // -----------------
            disposed = true;
            GC.SuppressFinalize(this);
        }
        ~Impersonator() { Dispose(false); }

        #endregion IDisposable
    }
}
