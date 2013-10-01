using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ForerunnerRegister;
using ForerunnerWebService;
using System.Threading;
using System.Security.Cryptography;

namespace RegisterTest
{
    class Program
    {
        static void Main(string[] args)
        {
            TaskWorker tw = new TaskWorker();

            var rsa1 = new RSACryptoServiceProvider(2048);
            string publicXml = rsa1.ToXmlString(false);
            string privateXml = rsa1.ToXmlString(true); 

            //while (true)
            //{
                //tw.DoWork();
                //Thread.Sleep(1000);
            //}
        }
    }
}
