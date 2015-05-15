using System;
using System.Collections.Generic;
using System.Linq;
using System.Xml;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Management.Automation;
using System.IO;

namespace PublishExtension
{
    [Cmdlet(VerbsCommon.Add, "FRScriptRef")]
    public class AddFRScriptRefCmd : PSCmdlet
    {
        #region Parameter properties / definitions

        [Parameter(HelpMessage = "Fully qualified path to the .cshtml file",
                   Mandatory = true)]
        [Alias("c")]
        public string cshtmlPath { get; set; }

        [Parameter(HelpMessage = "Path to the script file (E.g., ~/Scripts/yourFile.js)",
                   Mandatory = true)]
        [Alias("j")]
        public string jsPath { get; set; }

        [Parameter(HelpMessage = "Switch to indication to insert the reference at beginning of the script section")]
        [Alias("i")]
        public SwitchParameter InsertBeginning { get; set; }

        private string _sectionName = "scripts";
        [Parameter(HelpMessage = "Section name. Default = 'scripts'")]
        [Alias("s")]
        public string SectionName
        {
            get
            {
                return _sectionName;
            }
            set
            {
                _sectionName = value;
            }
        }

        #endregion  // Parameter properties / definitions

        #region Processing methods

        protected override void BeginProcessing()
        {
            base.BeginProcessing();
        }
        protected override void ProcessRecord()
        {
            if (!File.Exists(cshtmlPath))
            {
                throw new ArgumentException("File not found: " + cshtmlPath, "cshtmlPath");
            }

            string cshtmlData = File.ReadAllText(cshtmlPath);

            string jsFilename = Path.GetFileName(jsPath);
            if (cshtmlData.IndexOf(jsFilename) != -1)
            {
                // The script reference already exists
                return;
            }

            string scriptReference = "  <script type='text/javascript' src='" + jsPath + "'></script>\r\n";
            Regex regex = null;
            if (InsertBeginning)
            {
                regex = new Regex(@"@section\s*" + SectionName + ".*\n");
            }
            else
            {
                regex = new Regex(@"@section\s*" + SectionName + "([^}]|\n)*");
            }

            Match match = regex.Match(cshtmlData);
            if (!match.Success)
            {
                throw new ArgumentException("Section not found: " + SectionName, "SectionName");
            }

            StringBuilder sb = new StringBuilder();
            sb.Append(cshtmlData.Substring(0, match.Index + match.Length));
            sb.Append(scriptReference);
            sb.Append(cshtmlData.Substring(match.Index + match.Length));

            File.WriteAllText(cshtmlPath, sb.ToString());
        }
        protected override void EndProcessing()
        {
            base.EndProcessing();
        }

        #endregion  // Processing methods

        #region Private methods and data

        #endregion  // Private methods and data
    }
}
