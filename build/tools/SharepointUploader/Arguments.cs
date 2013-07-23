//-----------------------------------------------------------------------
// <copyright file="Arguments.cs" company="Forerunner">
//     Copyright (C) 2013 Forerunner Software. All rights reserved.
// </copyright>
//-----------------------------------------------------------------------
namespace Forerunner.Tools.SharepointUploader
{
    using System;
    using System.Linq;
    using System.Net;
    using System.Xml.Linq;

    /// <summary>
    /// Parsed Arguments.
    /// </summary>
    internal class Arguments
    {
        /// <summary>
        /// Start chars for options.
        /// </summary>
        private static readonly char[] OptionsStart = new char[] { '-', '/' };

        /// <summary>
        /// Prevents a default instance of the <see cref="Arguments"/> class from being created.
        /// </summary>
        private Arguments()
        {
        }

        /// <summary>
        /// Gets the source.
        /// </summary>
        public string Source { get; private set; }

        /// <summary>
        /// Gets the target.
        /// </summary>
        public string Target { get; private set; }

        /// <summary>
        /// Gets the site.
        /// </summary>
        public Uri Site { get; private set; }

        /// <summary>
        /// Gets the credential.
        /// </summary>
        public NetworkCredential Credential { get; private set; }

        /// <summary>
        /// Tries to parse the arguments.
        /// </summary>
        /// <param name="args">The args.</param>
        /// <param name="result">The result.</param>
        /// <returns>whether or not it could parse.</returns>
        public static bool TryParse(string[] args, out Arguments result)
        {
            result = null;
            Arguments partial = new Arguments();
            if (args.Length < 2)
            {
                return false;
            }

            for (int i = 0; i < args.Length - 2; i++)
            {
                if (args[i].Length < 2 || !OptionsStart.Contains(args[i][0]))
                {
                    return false;
                }

                string option = args[i].Substring(1);
                if (string.Compare("s", option, StringComparison.OrdinalIgnoreCase) == 0 ||
                    string.Compare("site", option, StringComparison.OrdinalIgnoreCase) == 0)
                {
                    i++;
                    if (i >= args.Length - 2)
                    {
                        return false;
                    }

                    Uri siteUrl = null;
                    if (!Uri.TryCreate(args[i], UriKind.Absolute, out siteUrl))
                    {
                        return false;
                    }

                    partial.Site = siteUrl;
                }
                else if (string.Compare("c", option, StringComparison.OrdinalIgnoreCase) == 0 ||
                    string.Compare("credential", option, StringComparison.OrdinalIgnoreCase) == 0)
                {
                    i++;
                    if (i >= args.Length - 2)
                    {
                        return false;
                    }

                    string credentialFile = args[i];
                    partial.Credential = LoadCredential(credentialFile);
                    if (partial.Credential == null)
                    {
                        return false;
                    }
                }
                else
                {
                    return false;
                }
            }

            partial.Source = args[args.Length - 2];
            partial.Target = args[args.Length - 1];
            if (partial.Site == null || partial.Credential == null)
            {
                return false;
            }

            result = partial;
            return true;
        }

        /// <summary>
        /// Loads the credential.
        /// </summary>
        /// <param name="path">The path to the credential XML file.</param>
        /// <returns>the loaded cred or null.</returns>
        private static NetworkCredential LoadCredential(string path)
        {
            XDocument doc = XDocument.Load(path);
            XElement credElem = doc.Element(XName.Get("Credential"));
            if (credElem == null)
            {
                return null;
            }

            string userName = credElem.Attribute(XName.Get("UserName")).Value;
            string password = credElem.Attribute(XName.Get("Password")).Value;
            return new NetworkCredential(userName, password);
        }
    }
}
