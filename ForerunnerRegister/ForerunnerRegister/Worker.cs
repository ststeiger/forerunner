using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Linq;
using System.ServiceProcess;
using System.Text;
using System.Threading.Tasks;
using System.Data.SqlClient;
using System.Net.Mail;
using Register;
using System.Threading;

namespace ForerunnerRegister
{

    public partial class Worker : ServiceBase
    {
        public bool ShouldStop = false;
        public Worker()
        {
            InitializeComponent();
        }

        protected override void OnStart(string[] args)
        {
            ShouldStop = false;
            StartThreads();
        }

        public void StartThreads()
        {
            Thread t;
            for (int i = 0; i < 3; i++)
            {
                t = new Thread(() => this.Run());
                t.Start();
            }
        }

        protected override void OnStop()
        {
            ShouldStop = true;
        }

        public void Run()
        {
            // This is a sample worker implementation. Replace with your logic.
            Trace.TraceInformation("Worker entry point called", "Information");
            RegisterUtil Reg = new RegisterUtil();

            while (!ShouldStop)
            {
                Reg.DoWork();
                Thread.Sleep(1000);
            }
        }

       



    }
}
