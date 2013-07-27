using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace icongen
{
    class Program
    {
        static int Main(string[] args)
        {
            bool hadError = false;
            IconGen iconGen = new IconGen();

            try
            {
                Console.WriteLine("\nIconGen - Start\n");
                iconGen.Run(args);
            }
            catch (Exception e)
            {
                hadError = true;
                Console.Error.WriteLine("\nIconGen - Error {0}\n", e.Message);
            }

            if (!hadError)
            {
                Console.WriteLine("\nIconGen - Succeeded\n");
                return 0;
            }

            return -1;
        }
    }
}
