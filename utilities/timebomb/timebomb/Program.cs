using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;

namespace timebomb
{
    class Program
    {
        static int Main(string[] args)
        {
            bool hadError = false;
            Main timeBomb = new Main();

            try
            {
                Console.WriteLine("\nTimeBomb - Start\n");
                timeBomb.Run(args);
            }
            catch (Exception e)
            {
                hadError = true;
                Console.Error.WriteLine("\nTimeBomb - Error {0}", e.Message);
                if (e.InnerException != null && e.InnerException.Message != null)
                {
                    Console.Error.WriteLine("           innerException: {0}\n", e.InnerException.Message);
                }
            }

            if (!hadError)
            {
                Console.WriteLine("\nTimeBomb - Succeeded\n");
                return 0;
            }

            return -1;

        }
    }
}
