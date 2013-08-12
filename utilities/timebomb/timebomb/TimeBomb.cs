using System;
using System.IO;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml;
using System.Xml.Serialization;

namespace timebomb
{
    class TimeBomb
    {
        #region methods
        public void Run(string[] args)
        {
            options = new Options();
            options.Parse(args);

            if (options.Help || args.Length == 0)
            {
                Console.WriteLine(
                    "\nTimeBomb -help -" + Options.createArg + " -" + Options.removeArg + " -" + Options.dumpArg + " -" + Options.installDateArg +
                    "\n" +
                    "    TimeBomb is used to create, remove, store and / or dump TimeBomb data. It is very usefull\n" +
                    "    for manually provisioning development and test machines. TimeBomb must be run as administrator.\n" +
                    "\n" +
                    "    Command line switches may be abbreviated to their first character and are not case\n" +
                    "    sensitive.\n" +
                    "\n" +
                    "Usage:\n" +
                    "\n" +
                    "-help\n" +
                    "    Displays this usage statement\n" +
                    "\n" +
                    "-create\n" +
                    "    Will create the timebomb data in the system registry\n" +
                    "\n" +
                    "-remove\n" +
                    "    Will remove the timebomb data from the system registry\n" +
                    "\n" +
                    " -dump\n" +
                    "    Will dump the timebomb data currently defined in the system registry and dump new\n" +
                    "     timebomb data for this machine. If the -dump and -create options are specified, dump\n" +
                    "     will be run first. \n" +
                    "\n" +
                    "-installDate\n" +
                    "    Date to use as the installation date. This date is used to test the time bamb. Future\n" +
                    "    and past dates are allowed. Entering a future date will effectively make the time bomb\n" +
                    "    grace period longer. The format for the date is defined by the DateTime.Parse() method.\n" +
                    "    Sample dates are:\n" +
                    "        2013-08-10\n" +
                    "        2013-08-10T11:00\n" +
                    "        2013-08-10T14:00\n" +
                    "\n");
                return;
            }

            // Validate the options given
            options.Validate();

            if (options.Dump)
            {
                Dump();
            }

            if (options.Create)
            {
                Create();
            }

            if (options.Remove)
            {
                Forerunner.SSR.Core.TimeBomb.Remove();
                Console.WriteLine("\nTimeBomb - Time Bomb data removed\n");
            }

            return;
        }

        //
        // Private methods
        private void Dump()
        {
            Forerunner.SSR.Core.TimeBomb ssrTimebomb = null;

            try
            {
                ssrTimebomb = Forerunner.SSR.Core.TimeBomb.LoadFromRegistry();
            }
            catch (Exception e)
            {
                Console.Error.WriteLine("\nTimeBomb - Dump {0}\n", e.Message);
                return;
            }

            Console.WriteLine("\nTimeBomb - dump\n\nStored time bomb:\n");
            Dump(ssrTimebomb);

            Forerunner.SSR.Core.TimeBomb newSsrTimeBomb = Forerunner.SSR.Core.TimeBomb.Create();
            Console.WriteLine("\nNew time bomb:\n");
            Dump(newSsrTimeBomb);
        }

        private static void Dump(Forerunner.SSR.Core.TimeBomb ssrTimebomb)
        {
            StringBuilder sb = new StringBuilder();
            StringWriter writer = new StringWriter(sb);
            XmlSerializer serializer = new XmlSerializer(typeof(Forerunner.SSR.Core.TimeBomb));
            serializer.Serialize(writer, ssrTimebomb);
            Console.WriteLine("\n{0}\n", sb.ToString());
        }

        private void Create()
        {
            Forerunner.SSR.Core.TimeBomb ssrTimebomb;

            if (options.HasInstallDate)
            {
                ssrTimebomb = Forerunner.SSR.Core.TimeBomb.Create(options.InstallDate);
            }
            else
            {
                ssrTimebomb = Forerunner.SSR.Core.TimeBomb.Create();
            }

            ssrTimebomb.SaveToRegistry();
            Console.WriteLine("\nTimeBomb - new Time Bomb created\n");
        }

        #endregion  // methods

        #region Private data
        private Options options;
        #endregion
    }
}
