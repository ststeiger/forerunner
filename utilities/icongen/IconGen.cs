using System;
using System.IO;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml;

namespace icongen
{
    class IconGen
    {
        #region Public methods
        public void Run(string[] args)
        {
            options = new Options();
            options.Parse(args);
            options.Validate();

            if (options.Help || args.Length == 0)
            {
                Console.WriteLine(
                    "\nIconGen -help -" + Options.configArg + " <config file> -" + Options.imageFolderArg + " <images folder path> -" + Options.outputFolderArg + " <output folder path>\n" +
                    "\n" +
                    "    IconGen will write composite icon file(s) to the given output folder based upon\n" +
                    "     the given configuration file. The icon file is antialiased using a HighQualityBilinear\n" +
                    "     algorithm\n" +
                    "\n" +
                    "    Command line switches may be abbreviated to their first character and are not case\n" +
                    "     sensitive.\n" +
                    "\n" +
                    "Usage:\n" +
                    "\n" +
                    "-help\n" +
                    "    Displays this usage statement\n" +
                    "\n" +
                    "-config <config file>\n" +
                    "    Required. Fully qualified path to the configuration file\n" +
                    "\n" +
                    " -imageFolder <images folder path>\n" +
                    "    Required. Fully qualified path to the source images folder\n" +
                    "\n" +
                    " -outputFolder <output folder path>\n" +
                    "    Required. Fully qualified path to the output folder\n" +
                    "\n");
                return;
            }

            ProcessConfigFile();

            return;
        }

        //
        // Private methods
        private void ProcessConfigFile()
        {
            XmlDocument configDoc = new XmlDocument();
            configDoc.Load(options.ConfigFile);

            XmlNodeList outFilesNodeList = configDoc.SelectNodes("/iconfiles/compositeimage");
            foreach (XmlNode compositeImageNode in outFilesNodeList)
            {
                int width = Convert.ToInt32(compositeImageNode.Attributes["width"].InnerText);
                int height = Convert.ToInt32(compositeImageNode.Attributes["height"].InnerText);
                int margin = Convert.ToInt32(compositeImageNode.Attributes["margin"].InnerText);

                String compositeImageClassName = compositeImageNode.Attributes["classname"].InnerText;

                List<String> sourceFileList = new List<String>();
                List<String> imageClassNames = new List<String>();
                foreach (XmlNode sourceFile in compositeImageNode.ChildNodes)
                {
                    sourceFileList.Add(sourceFile.Attributes["name"].InnerText);
                    imageClassNames.Add(sourceFile.Attributes["classname"].InnerText);
                }

                CompositeImage compositeImage = new CompositeImage(width, height, options.ImageFolder, sourceFileList);
                compositeImage.Create();
                
                String outFilename = Path.Combine(options.OutputFolder, compositeImageNode.Attributes["name"].InnerText);
                compositeImage.Save(outFilename);

                Console.WriteLine(String.Format("\nIconGen - file: {0} written, iconWidth: {1}, iconHeight: {2}", Path.GetFileName(outFilename), width, height));

                // Create the StyleSheet class and write out the CSS file
                String relativeUrlPath = compositeImageNode.Attributes["relativeurlpath"].InnerText + "/" + compositeImageNode.Attributes["name"].InnerText;
                StyleSheet styleSheet = new StyleSheet(width, height, margin, relativeUrlPath, compositeImageClassName, imageClassNames);
                String cssFilename = Path.Combine(options.OutputFolder, compositeImageNode.Attributes["cssname"].InnerText);
                styleSheet.Save(cssFilename);

                Console.WriteLine(String.Format("\nIconGen - file: {0} written", Path.GetFileName(cssFilename)));
            }
        }
        #endregion

        #region Private data
        private Options options;
        #endregion
    }
}
