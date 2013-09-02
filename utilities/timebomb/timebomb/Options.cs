using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace timebomb
{
    class Options
    {
        #region Public Static strings
        public static String helpArg = "help";
        public static String createArg = "create";
        public static String removeArg = "remove";
        public static String dumpArg = "dump";
        public static String installDateArg = "installDate";
        #endregion

        #region Public Properties
        public bool Help
        {
            get
            {
                return help;
            }
        }

        public bool Create
        {
            get
            {
                return create;
            }
        }

        public bool Remove
        {
            get
            {
                return remove;
            }
        }

        public bool Dump
        {
            get
            {
                return dump;
            }
        }

        public DateTime InstallDate
        {
            get
            {
                return installDate;
            }
        }

        public bool HasInstallDate
        {
            get
            {
                return hasInstallDate;
            }
        }

        #endregion  // Public Properties

        #region Public methods
        public void Parse(String[] args)
        {
            for (int i = 0; i < args.Length; i++)
            {
                String arg = args[i];

                if (IsOption(arg, "? " + Options.helpArg[0] + " " + Options.helpArg))
                {
                    help = true;
                }
                else if (IsOption(arg, Options.createArg[0] + " " + Options.createArg))
                {
                    create = true;
                }
                else if (IsOption(arg, Options.removeArg[0] + " " + Options.removeArg))
                {
                    remove = true;
                }
                else if (IsOption(arg, Options.dumpArg[0] + " " + Options.dumpArg))
                {
                    dump = true;
                }
                else if (IsOption(arg, Options.installDateArg[0] + " " + Options.installDateArg))
                {
                    hasInstallDate = true;
                    String dateParam = GetParam(++i, args, Options.installDateArg);
                    installDate = DateTime.Parse(dateParam);
                }
                else
                {
                    throw new Exception(String.Format("unrecognized parameter: {0}", arg));
                }
            }
        }
        public void Validate()
        {
            if (create && remove)
            {
                throw new Exception("Create and Remove cannot be used on the same run");
            }
        }

        #endregion  // public methods

        #region Private methods
        private void ValidateFolderParam(String folder, String argName)
        {
            if (folder == null)
            {
                throw new Exception(String.Format("missing required parameter: {0}", argName));
            }
            else if (!Directory.Exists(folder))
            {
                throw new Exception(String.Format(argName + ": {0}, does not exist", folder));
            }
        }

        private String GetParam(int i, String[] args, String argName)
        {
            if (i >= args.Length || IsSwitch(args[i]))
            {
                throw new Exception(String.Format("invalid syntax: the '{0}' option, requires a parameter", argName));
            }

            return args[i];
        }

        // Options:
        //  - May begin with either a dash of a slash character or no prefix
        //  - Are not case sensitive
        private bool IsOption(String arg, String alternates)
        {
            String option = arg.ToLower();
            if (IsSwitch(arg))
            {
                // Note that is is ok if the switches don't start wit a dash or slash
                option = option.Substring(1);
            }

            foreach (String alternate in alternates.Split(' '))
            {
                if (alternate.ToLower() == option)
                {
                    return true;
                }
            }

            return false;
        }

        private bool IsSwitch(String arg)
        {
            if (arg.StartsWith(@"-") || arg.StartsWith(@"/"))
            {
                return true;
            }

            return false;
        }
        #endregion

        #region Private data
        private bool help = false;
        private bool create = false;
        private bool remove = false;
        private bool dump = false;
        private DateTime installDate;
        private bool hasInstallDate = false;
        #endregion
    }
}
