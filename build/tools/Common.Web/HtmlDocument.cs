//-----------------------------------------------------------------------
// <copyright file="HtmlDocument.cs" company="Jon Rowlett">
//     Copyright (C) 2010 Jon Rowlett. All rights reserved.
// </copyright>
// <author>Jon Rowlett</author>
//-----------------------------------------------------------------------

namespace Common.Web
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Text;
    using System.Text.RegularExpressions;
    using System.Xml;

    /// <summary>
    /// A Parsed Html Document.
    /// </summary>
    public class HtmlDocument
    {
        /// <summary>
        /// html start tag.
        /// </summary>
        private static readonly Regex htmlTagStart = new Regex("<[hH][tT][mM][lL][^>]*>");
        
        /// <summary>
        /// html end tag.
        /// </summary>
        private static readonly Regex htmlTagEnd = new Regex("</[hH][tT][mM][lL]>");
        
        /// <summary>
        /// head start tag.
        /// </summary>
        private static readonly Regex headTagStart = new Regex("<[hH][eE][aA][dD][^>]*>");
        
        /// <summary>
        /// head end tag.
        /// </summary>
        private static readonly Regex headTagEnd = new Regex("</[hH][eE][aA][dD]>");

        /// <summary>
        /// title start tag.
        /// </summary>
        private static readonly Regex titleTagStart = new Regex("<[tT][iI][tT][lL][eE][^>]*>");

        /// <summary>
        /// title end tag.
        /// </summary>
        private static readonly Regex titleTagEnd = new Regex("</[tT][iI][tT][lL][eE]>");

        /// <summary>
        /// body start tag.
        /// </summary>
        private static readonly Regex bodyTagStart = new Regex("<[bB][oO][dD][yY][^>]*>");
        
        /// <summary>
        /// body end tag.
        /// </summary>
        private static readonly Regex bodyTagEnd = new Regex("</[bB][oO][dD][yY]>");
        
        /// <summary>
        /// form start tag.
        /// </summary>
        private static readonly Regex formTagStart = new Regex("<[fF][oO][rR][mM][^>]*>");
        
        /// <summary>
        /// form end tag.
        /// </summary>
        private static readonly Regex formTagEnd = new Regex("</[fF][oO][rR][mM]>");
        
        /// <summary>
        /// input start tag.
        /// </summary>
        private static readonly Regex inputTagStart = new Regex("<[iI][nN][pP][uU][tT][^>]*>");
        
        /// <summary>
        /// textarea start tag.
        /// </summary>
        private static readonly Regex textAreaTagStart = new Regex("<[tT][eE][xX][tT][aA][rR][eE][aA][^>]*>");
        
        /// <summary>
        /// textarea end tag.
        /// </summary>
        private static readonly Regex textAreaTagEnd = new Regex("</[tT][eE][xX][tT][aA][rR][eE][aA]>");
        
        /// <summary>
        /// select tag start.
        /// </summary>
        private static readonly Regex selectTagStart = new Regex("<[sS][eE][lL][eE][cC][tT][^>]*>");
        
        /// <summary>
        /// select tag end.
        /// </summary>
        private static readonly Regex selectTagEnd = new Regex("</[sS][eE][lL][eE][cC][tT]>");
        
        /// <summary>
        /// option tag start.
        /// </summary>
        private static readonly Regex optionTagStart = new Regex("<[oO][pP][tT][iI][oO][nN][^>]*>");
        
        /// <summary>
        /// meta tag start.
        /// </summary>
        private static readonly Regex metaTagStart = new Regex("<[mM][eE][tT][aA][^>]*>");

        /// <summary>
        /// The xml document.
        /// </summary>
        private XmlDocument document = new XmlDocument();

        /// <summary>
        /// Initializes a new instance of the HtmlDocument class.
        /// </summary>
        public HtmlDocument()
        {
        }

        /// <summary>
        /// Gets the root Html tag.
        /// </summary>
        public XmlElement DocumentElement
        {
            get
            {
                return this.document.DocumentElement;
            }
        }

        /// <summary>
        /// Gets the title.
        /// </summary>
        public string Title
        {
            get
            {
                if (this.document == null)
                {
                    return null;
                }

                return this.SelectSingleNode("/html/head/title/text()").Value;
            }
        }

        /// <summary>
        /// Gets the meta refresh url if present.
        /// </summary>
        public Uri MetaRefreshUrl
        {
            get
            {
                if (this.document == null)
                {
                    return null;
                }

                System.Xml.XmlNode node = this.SelectSingleNode("//meta[@http-equiv='refresh']/@content");
                if (node == null)
                {
                    return null;
                }

                string refresh = node.Value;

                int sepChar = refresh.IndexOf("url=");
                if (sepChar < 0)
                {
                    return null;
                }

                return new Uri(refresh.Substring(sepChar + 4));
            }
        }

        /// <summary>
        /// Loads html from the given html string.
        /// </summary>
        /// <param name="htmlText">the html input.</param>
        public void LoadHtml(string htmlText)
        {
            string htmlContents = null;
            string htmlRemainder = null;
            string htmlTag = null;
            if (!TryFindElement(htmlText, htmlTagStart, htmlTagEnd, out htmlContents, out htmlRemainder, out htmlTag))
            {
                return;
            }
 
            this.document.RemoveAll();
            XmlElement htmlElement = this.document.CreateElement("html");
            this.PopulateAttributes(htmlElement, htmlTag);
            this.document.AppendChild(htmlElement);

            string headContents = null;
            string headRemainder = null;
            string headTag = null;
            if (!TryFindElement(htmlContents, headTagStart, headTagEnd, out headContents, out headRemainder, out headTag))
            {
                return;
            }

            XmlElement headElement = this.document.CreateElement("head");
            this.PopulateAttributes(headElement, headTag);
            htmlElement.AppendChild(headElement);

            string metaContents = null;
            string metaRemainder = headContents;
            string metaTag = null;
            while (TryFindElement(metaRemainder, metaTagStart, null, out metaContents, out metaRemainder, out metaTag))
            {
                XmlElement metaElement = this.document.CreateElement("meta");
                this.PopulateAttributes(metaElement, metaTag);
                headElement.AppendChild(metaElement);
            }

            string titleContents = null;
            string titleRemainder = headContents;
            string titleTag = null;
            if (TryFindElement(titleRemainder, titleTagStart, titleTagEnd, out titleContents, out titleRemainder, out titleTag))
            {
                XmlElement titleElement = this.document.CreateElement("title");
                XmlText titleText = this.document.CreateTextNode(titleContents);
                this.PopulateAttributes(titleElement, titleTag);
                titleElement.AppendChild(titleText);
                headElement.AppendChild(titleElement);
            }

            string bodyContents = null;
            string bodyRemainder = null;
            string bodyTag = null;
            if (!TryFindElement(headRemainder, bodyTagStart, bodyTagEnd, out bodyContents, out bodyRemainder, out bodyTag))
            {
                return;
            }

            XmlElement bodyElement = this.document.CreateElement("body");
            this.PopulateAttributes(bodyElement, bodyTag);
            htmlElement.AppendChild(bodyElement);

            string formContents = null;
            string formRemainder = bodyContents;
            string formTag = null;
            while (TryFindElement(formRemainder, formTagStart, formTagEnd, out formContents, out formRemainder, out formTag))
            {
                XmlElement formElement = this.document.CreateElement("form");
                this.PopulateAttributes(formElement, formTag);
                bodyElement.AppendChild(formElement);

                string inputContents = null;
                string inputRemainder = formContents;
                string inputTag = null;
                while (TryFindElement(inputRemainder, inputTagStart, null, out inputContents, out inputRemainder, out inputTag))
                {
                    XmlElement inputElement = this.document.CreateElement("input");
                    this.PopulateAttributes(inputElement, inputTag);
                    formElement.AppendChild(inputElement);
                }

                string textAreaContents = null;
                string textAreaRemainder = formContents;
                string textAreaTag = null;
                while (TryFindElement(textAreaRemainder, textAreaTagStart, textAreaTagEnd, out textAreaContents, out textAreaRemainder, out textAreaTag))
                {
                    XmlElement textAreaElement = this.document.CreateElement("textarea");
                    this.PopulateAttributes(textAreaElement, textAreaTag);
                    XmlText text = this.document.CreateTextNode(textAreaContents);
                    textAreaElement.AppendChild(text);
                    formElement.AppendChild(textAreaElement);
                }

                string selectContents = null;
                string selectRemainder = formContents;
                string selectTag = null;
                while (TryFindElement(selectRemainder, selectTagStart, selectTagEnd, out selectContents, out selectRemainder, out selectTag))
                {
                    XmlElement selectElement = this.document.CreateElement("select");
                    this.PopulateAttributes(selectElement, selectTag);
                    formElement.AppendChild(selectElement);

                    string optionContents = null;
                    string optionRemainder = selectContents;
                    string optionTag = null;
                    while (TryFindElement(optionRemainder, optionTagStart, null, out optionContents, out optionRemainder, out optionTag))
                    {
                        XmlElement optionElement = this.document.CreateElement("option");
                        this.PopulateAttributes(optionElement, optionTag);
                        selectElement.AppendChild(optionElement);
                    }
                }
            }
        }

        /// <summary>
        /// Selects a node via xpath.
        /// </summary>
        /// <param name="xpath">the path to the node.</param>
        /// <returns>the matching node.</returns>
        public XmlNode SelectSingleNode(string xpath)
        {
            return this.document.SelectSingleNode(xpath);
        }

        /// <summary>
        /// Tries to find a single element.
        /// </summary>
        /// <param name="input">the input string.</param>
        /// <param name="start">where to start.</param>
        /// <param name="end">where to end.</param>
        /// <param name="contents">receives the contents.</param>
        /// <param name="remainder">receives the remainder.</param>
        /// <param name="startTag">receives the entire start tag.</param>
        /// <returns>whether or not it could find an element.</returns>
        private static bool TryFindElement(
            string input, 
            Regex start, 
            Regex end, 
            out string contents, 
            out string remainder, 
            out string startTag)
        {
            startTag = null;
            contents = null;
            remainder = input;
            Match startMatch = start.Match(input);
            if (!startMatch.Success)
            {
                return false;
            }

            startTag = startMatch.Value;

            string afterTag = input.Substring(startMatch.Index + startMatch.Length);
            if (end != null)
            {
                Match endMatch = end.Match(afterTag);
                if (!endMatch.Success)
                {
                    return false;
                }

                contents = afterTag.Substring(0, endMatch.Index);
                remainder = afterTag.Substring(endMatch.Index + endMatch.Length);
            }
            else
            {
                contents = null;
                remainder = afterTag;
            }

            return true;
        }

        /// <summary>
        /// Expands entity references.
        /// </summary>
        /// <param name="source">the source string.</param>
        /// <returns>the expanded string.</returns>
        private static string ExpandEntities(string source)
        {
            string[][] map = new string[][]
            {
                new string[] { "&acute;", "&#180;" },
                new string[] { "&euro;", "&#8364;" }
            };

            return map.Aggregate(source, (e, f) => e.Replace(f[0], f[1]));
        }

        /// <summary>
        /// Populates Xml attributes from a source tag string.
        /// </summary>
        /// <param name="element">the element to populate.</param>
        /// <param name="tag">the tag source.</param>
        private void PopulateAttributes(XmlElement element, string tag)
        {
            try
            {
                this.InnerPopulateAttributes(element, tag);
            }
            catch (XmlException)
            {
                // In HTML, '&' does not have to be escaped. The source won't be partially escaped. Assume consistent escaping.
                string escapedTag = tag.Replace("&", "&amp;");
                this.InnerPopulateAttributes(element, escapedTag);
            }
        }

        /// <summary>
        /// Populate attributes implementation.
        /// </summary>
        /// <param name="element">The element to populate.</param>
        /// <param name="tag">The tag source.</param>
        private void InnerPopulateAttributes(XmlElement element, string tag)
        {
            XmlReaderSettings readerSettings = new XmlReaderSettings();

            readerSettings.ValidationType = ValidationType.None;
            readerSettings.ConformanceLevel = ConformanceLevel.Auto;

            using (XmlReader reader = XmlTextReader.Create(
                new StringReader(ExpandEntities(tag)),
                readerSettings))
            {
                if (reader.Read())
                {
                    if (reader.MoveToFirstAttribute())
                    {
                        XmlAttribute attribute = this.document.CreateAttribute(reader.Name);
                        attribute.Value = reader.Value;
                        element.Attributes.Append(attribute);
                        while (reader.MoveToNextAttribute())
                        {
                            attribute = this.document.CreateAttribute(reader.Name);
                            attribute.Value = reader.Value;
                            element.Attributes.Append(attribute);
                        }
                    }
                }
            }
        }
    }
}
