//-----------------------------------------------------------------------
// <copyright file="HtmlUtility.cs" company="Jon Rowlett">
//     Copyright (C) 2010 Jon Rowlett. All rights reserved.
//     Licensed by Jon Rowlett to Stella Rowlett royalty free for use with ForeRunner.
// </copyright>
// <author>Jon Rowlett</author>
//-----------------------------------------------------------------------
namespace Common.Web
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.IO;
    using System.Text;

    /// <summary>
    /// Utility functions 
    /// </summary>
    public static class HtmlUtility
    {
        /// <summary>
        /// Encodes a string to be part of a URL
        /// </summary>
        /// <param name="text">text to encode</param>
        /// <returns>the encoded string</returns>
        public static string UrlEncode(string text)
        {
            StringBuilder sb = new StringBuilder();

            foreach (char ch in text)
            {
                if (Char.IsLetterOrDigit(ch) ||
                    ch == '-' ||
                    ch == '_' ||
                    ch == '.' ||
                    ch == '!' ||
                    ch == '~' ||
                    ch == '*' ||
                    ch == '\'' ||
                    ch == '(' ||
                    ch == ')')
                {
                    sb.Append(ch);
                }
                else
                {
                    byte[] encoded = Encoding.UTF8.GetBytes(new char[] { ch });
                    sb.Append('%');
                    foreach (byte b in encoded)
                    {
                        sb.AppendFormat(
                            System.Globalization.CultureInfo.InvariantCulture,
                            "{0:X2}",
                            b);
                    }
                }
            }

            return sb.ToString();
        }

        /// <summary>
        /// Decodes a string encoded with url encoding
        /// </summary>
        /// <param name="encodedText">url encoded text</param>
        /// <returns>the decoded text</returns>
        public static string UrlDecode(string encodedText)
        {
            StringBuilder sb = new StringBuilder();

            using (StringReader reader = new StringReader(encodedText))
            {
                int ch = reader.Read();
                while (ch >= 0)
                {
                    if (ch == (int)'%')
                    {
                        char[] hexDigits = new char[2];
                        if (reader.ReadBlock(hexDigits, 0, hexDigits.Length) != hexDigits.Length)
                        {
                            throw new ArgumentOutOfRangeException("encodedText");
                        }

                        string hexString = new string(hexDigits);
                        byte charValue = 0;
                        if (!byte.TryParse(hexString, NumberStyles.HexNumber, CultureInfo.InvariantCulture, out charValue))
                        {
                            throw new ArgumentOutOfRangeException("encodedText");
                        }

                        sb.Append(Encoding.UTF8.GetChars(new byte[] { charValue }));
                    }
                    else
                    {
                        sb.Append((char)ch);
                    }

                    ch = reader.Read();
                }
            }

            return sb.ToString();
        }

        /// <summary>
        /// Parses the query portion of a url
        /// </summary>
        /// <param name="url">url with a query string</param>
        /// <returns>name value pairs</returns>
        public static IDictionary<string, string> GetUrlQuery(Uri url)
        {
            return ParseQuery(url.Query);
        }

        /// <summary>
        /// Parses the fragment portion of a url as a query string.
        /// </summary>
        /// <param name="url">url with a query string</param>
        /// <returns>name value pairs</returns>
        public static IDictionary<string, string> ParseFragment(Uri url)
        {
            string fragment = url.Fragment;
            if (fragment.StartsWith("#", StringComparison.Ordinal))
            {
                fragment = fragment.Substring(1);
            }

            return ParseQuery(fragment);
        }

        /// <summary>
        /// Parses the query portion of a url
        /// </summary>
        /// <param name="query">the query string</param>
        /// <returns>name value pairs</returns>
        public static IDictionary<string, string> ParseQuery(string query)
        {
            string[] parts = query.Split('&');
            Dictionary<string, string> results = new Dictionary<string, string>();
            foreach (string part in parts)
            {
                int equalsSign = part.IndexOf('=');
                if (equalsSign > 0)
                {
                    string namePart = UrlDecode(part.Substring(0, equalsSign));
                    string valuePart = UrlDecode(part.Substring(equalsSign + 1));
                    results.Add(namePart, valuePart);
                }
            }

            return results;
        }
    }
}
