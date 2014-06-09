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
        public ThreadContext(String path, Security.Impersonator sqlImpersonator, bool second = false)
        {
            Path = path;
            this.sqlImpersonator = sqlImpersonator;

            if (second)
            {
                this.secondImpersonator = new Security.CurrentUserImpersonator();
            }
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

        // Second impersonator should be cleaned out by the ReportViewer as 
        // it will be passed into the viewer.
        private Security.CurrentUserImpersonator secondImpersonator;
        public Security.CurrentUserImpersonator SecondImpersonator
        {
            get
            {
                return secondImpersonator;
            }
        }

        //Dispose(bool) should be declared as protected, virtual, and unsealed
        protected override void Dispose(bool isDisposing)
        {
            if (disposed) return;
            if (isDisposing)
            {
                base.Dispose(isDisposing);
                if (sqlImpersonator != null)
                {
                    sqlImpersonator.Dispose();
                }
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
