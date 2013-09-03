using System;
using System.Collections.Generic;
using System.Net;
using System.Text;
using System.Security.Principal;
using System.Web;
using System.Web.Security;

namespace Forerunner.Security
{
    internal class CurrentUserImpersonator : IDisposable
    {
        public CurrentUserImpersonator()
        {
            if (Forerunner.Security.AuthenticationMode.GetAuthenticationMode() == System.Web.Configuration.AuthenticationMode.Forms)
            {
                // Get it from Cookies otherwise
                HttpCookie authCookie = HttpContext.Current.Request.Cookies[FormsAuthentication.FormsCookieName];
                FormsAuthenticationTicket authTicket = FormsAuthentication.Decrypt(authCookie.Value);

                this.NetworkCredential = new NetworkCredential(authTicket.Name, authTicket.UserData);
                return;
            }

            duplicateIdentity();
        }

        public NetworkCredential NetworkCredential { get; set; }
        private IntPtr duplicateToken;
        private WindowsIdentity identity;
        private string userName;

        private void duplicateIdentity()
        {
            var token = WindowsIdentity.GetCurrent().Token;
            duplicateToken = new IntPtr(0);
            userName = WindowsIdentity.GetCurrent().Name;
            const int SecurityLevel = 2;
            if (Security.NativeMethods.DuplicateToken(token, SecurityLevel, ref duplicateToken) == false)
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
            if (identity != null)
            {
                if (context == null)
                {
                    context = identity.Impersonate();
                }
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

        public string UserName
        {
            get { return userName; }
        }
    }
}
