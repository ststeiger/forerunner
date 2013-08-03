using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Security.Principal;
using System.Web;

namespace Forerunner.Security
{
    internal class CurrentUserImpersonator : IDisposable
    {
        public CurrentUserImpersonator()
        {
            duplicateIdentity();
        }

        private IntPtr duplicateToken;
        private WindowsIdentity identity;

        private void duplicateIdentity()
        {
            var token = ((WindowsIdentity)HttpContext.Current.User.Identity).Token;
            duplicateToken = new IntPtr(0);

            const int SecurityImpersonation = 2;
            if (Security.NativeMethods.DuplicateToken(token, SecurityImpersonation, ref duplicateToken) == false)
            {
                throw new ApplicationException("Failed to impersonate current user");
            }

            identity = new WindowsIdentity(duplicateToken);
        }
        private bool disposed;
        public void Dispose() { Dispose(true); }
        //Dispose(bool) should be declared as protected, virtual, and unsealed
        protected virtual void Dispose(bool isDisposing)
        {
            if (disposed) return;
            if (isDisposing)
            {
                if (identity != null)
                {
                    identity.Dispose();
                }
                if (!duplicateToken.Equals(IntPtr.Zero))
                {
                    Security.NativeMethods.CloseHandle(duplicateToken);
                }
            }
            // -----------------
            disposed = true;
            GC.SuppressFinalize(this);
        }
        ~CurrentUserImpersonator() { Dispose(false); }

        private WindowsImpersonationContext context;
        public WindowsImpersonationContext Impersonate()
        {
            if (context == null)
            {
                context = identity.Impersonate();
            }
            return context;
        }

        public void Undo()
        {
            if (context != null)
            {
                context.Undo();
                context = null;
            }
        }
    }
}
