using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using ForerunnerLicense;
using System.Threading;
using System.Collections.Generic;

namespace ReportManagerUnitTest
{
    [TestClass]
    public class ClientLicenseTest
    {
        public static void ThreadProc()
        {
            ClientLicense.LastInit = new DateTime(2000, 1, 1);
            ClientLicense.LastServerValidation = new DateTime(2000, 1, 1);
            ClientLicense.LastServerValidationTry = new DateTime(2000, 1, 1);
            ClientLicense.Validate();    
        }
        [TestMethod]
        public void TestThreadingSTA()
        {
            CallValidateOnMultipleThreads(ApartmentState.STA);
        }

        private static void CallValidateOnMultipleThreads(ApartmentState state)
        {
            List<Thread> listOfThreads = new List<Thread>();
            for (int i = 0; i < 5; i++)
            {
                Thread t = new Thread(new ThreadStart(ThreadProc));
                t.SetApartmentState(state);
                t.Start();
                listOfThreads.Add(t);
            }

            for (int i = 0; i < 5; i++)
            {
                Thread t = listOfThreads[i];
                t.Join();
            }
        }

        [TestMethod]
        public void TestThreadingMTA()
        {
            CallValidateOnMultipleThreads(ApartmentState.MTA);
        }
    }
}
