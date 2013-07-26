using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace icongen
{
    class Options
    {
        #region Public Static strings
        public static String helpArg = "help";
        public static String configArg = "config";
        public static String imageFolderArg = "imageFolder";
        public static String outputFolderArg = "outputFolder";
        #endregion

        #region Public Properties
        public bool Help
        {
            get
            {
                return help;
            }
        }

        public String ImageFolder
        {
            get
            {
                return imageFolder;
            }
        }

        public String OutputFolder
        {
            get
            {
                return outputFolder;
            }
        }

        public String ConfigFile
        {
            get
            {
                return configFile;
            }
        }
        #endregion

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
                else if (IsOption(arg, Options.configArg[0] + " " + Options.configArg))
                {
                    configFile = GerParam(++i, args, arg);
                }
                else if (IsOption(arg, Options.imageFolderArg[0] + " " + Options.imageFolderArg))
                {
                    imageFolder = GerParam(++i, args, arg);
                }
                else if (IsOption(arg, Options.outputFolderArg[0] + " " + Options.outputFolderArg))
                {
                    outputFolder = GerParam(++i, args, arg);
                }
                else
                {
                    throw new Exception(String.Format("unrecognized parameter: {0}", arg));
                }
            }
        }

        public void Validate()
        {
            if (help)
            {
                // If they are asking for help return
                return;
            }

            // check the folder params
            ValidateFolderParam(imageFolder, Options.imageFolderArg);
            ValidateFolderParam(outputFolder, Options.outputFolderArg);

            // Check the file param
            if (configFile == null)
            {
                throw new Exception(String.Format("missing required parameter: {0}", Options.configArg));
            }
            else if (!File.Exists(configFile))
            {
                throw new Exception(String.Format(Options.configArg + ": {0}, does not exist", configArg));
            }
        }
        #endregion

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

        private String GerParam(int i, String[] args, String argName)
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
        private String imageFolder;
        private String outputFolder;
        private String configFile;
        #endregion
    }
}
