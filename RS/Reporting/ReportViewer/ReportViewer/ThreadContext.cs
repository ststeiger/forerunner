using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Security.Principal;
using System.Web;

namespace Forerunner
{
    internal class ThreadContext : Security.CurrentUserImpersonator, IDisposable
    {
        public ThreadContext(String path, Security.Impersonator sqlImpersonator )
        {
            Path = path;
            this.sqlImpersonator = sqlImpersonator;
        }
        
        private bool disposed;
        private Security.Impersonator sqlImpersonator;
        public Security.Impersonator SqlImpersonator
        {
            get
            {
                return sqlImpersonator;
            }
        }

        //Dispose(bool) should be declared as protected, virtual, and unsealed
        protected override void Dispose(bool isDisposing)
        {
            if (disposed) return;
            if (isDisposing)
            {
                base.Dispose(isDisposing);
            }
            // -----------------
            disposed = true;
            GC.SuppressFinalize(this);
        }
        ~ThreadContext() { Dispose(false); }
        public String Path
        {
            get;
            set;
        }
    }
}
