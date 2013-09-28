using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ForerunnerRegister;
using ForerunnerWebService;
using System.Threading;

namespace RegisterTest
{
    class Program
    {
        static void Main(string[] args)
        {
            TaskWorker tw = new TaskWorker();

            while (true)
            {
                tw.DoWork();
                Thread.Sleep(1000);
            }
        }
    }
}
