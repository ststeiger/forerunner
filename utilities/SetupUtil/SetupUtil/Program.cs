using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Forerunner.SSRS.Security;

namespace SetupUtil
{
    class Program
    {
        static int Main(string[] args)
        {
            if (TimeBomb.PreviouslyInstalled())
            {
                return 1;
            }

            TimeBomb timeBomb = TimeBomb.Create();
            timeBomb.SaveToRegistry();
            return 0;
        }
    }
}
