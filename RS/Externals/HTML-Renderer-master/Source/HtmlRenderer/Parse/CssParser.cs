﻿// "Therefore those skilled at the unorthodox
// are infinite as heaven and earth,
// inexhaustible as the great rivers.
// When they come to an end,
// they begin again,
// like the days and months;
// they die and are reborn,
// like the four seasons."
// 
// - Sun Tsu,
// "The Art of War"

using System;
using System.Collections.Generic;
using System.Text;
using System.Text.RegularExpressions;
using HtmlRenderer.Entities;
using HtmlRenderer.Utils;

namespace HtmlRenderer.Parse
{
    /// <summary>
    /// Parser to parse CSS stylesheet source string into CSS objects.
    /// </summary>
    internal static class CssParser
    {
        #region Fields and Consts

        /// <summary>
        /// split CSS rule
        /// </summary>
        private static readonly char[] _cssBlockSplitters = new[] { '}', ';' };

        #endregion

        /// <summary>
        /// Parse the given stylesheet source to CSS blocks dictionary.<br/>
        /// The CSS blocks are organized into two level buckets of media type and class name.<br/>
        /// Root media type are found under 'all' bucket.<br/>
        /// If <paramref name="combineWithDefault"/> is true the parsed css blocks are added to the 
        /// default css data (as defined by W3), merged if class name already exists. If false only the data in the given stylesheet is returned.
        /// </summary>
        /// <seealso cref="http://www.w3.org/TR/CSS21/sample.html"/>
        /// <param name="stylesheet">raw css stylesheet to parse</param>
        /// <param name="combineWithDefault">true - combine the parsed css data with default css data, false - return only the parsed css data</param>
        /// <returns>the CSS data with parsed CSS objects (never null)</returns>
        public static CssData ParseStyleSheet(string stylesheet, bool combineWithDefault)
        {
            var cssData = combineWithDefault ? CssUtils.DefaultCssData.Clone() : new CssData();
            if (!string.IsNullOrEmpty(stylesheet))
            {
                ParseStyleSheet(cssData, stylesheet);
            }
            return cssData;
        }

        /// <summary>
        /// Parse the given stylesheet source to CSS blocks dictionary.<br/>
        /// The CSS blocks are organized into two level buckets of media type and class name.<br/>
        /// Root media type are found under 'all' bucket.<br/>
        /// The parsed css blocks are added to the given css data, merged if class name already exists.
        /// </summary>
        /// <param name="cssData">the CSS data to fill with parsed CSS objects</param>
        /// <param name="stylesheet">raw css stylesheet to parse</param>
        public static void ParseStyleSheet(CssData cssData, string stylesheet)
        {
            if (!String.IsNullOrEmpty(stylesheet))
            {
                // Convert everything to lower-case so not to handle case in code
                stylesheet = stylesheet.ToLower();

                stylesheet = RemoveStylesheetComments(stylesheet);

                ParseStyleBlocks(cssData, stylesheet);

                ParseMediaStyleBlocks(cssData, stylesheet);
            }
        }

        /// <summary>
        /// Parse single CSS block source into CSS block instance.
        /// </summary>
        /// <param name="className">the name of the css class of the block</param>
        /// <param name="blockSource">the CSS block to parse</param>
        /// <returns>the created CSS block instance</returns>
        public static CssBlock ParseCssBlock(string className, string blockSource)
        {
            // Convert everything to lower-case so not to handle case in code
            blockSource = blockSource.ToLower();
            
            return ParseCssBlockImp(className, blockSource);
        }

        /// <summary>
        /// Parse a complex font family css property to check if it contains multiple fonts and if the font exists.<br/>
        /// returns the font family name to use or 'inherit' if failed.
        /// </summary>
        /// <param name="value">the font-family value to parse</param>
        /// <returns>parsed font-family value</returns>
        public static string ParseFontFamily(string value)
        {
            return ParseFontFamilyProperty(value);
        }


        #region Private methods

        /// <summary>
        /// Remove comments from the given stylesheet.
        /// </summary>
        /// <param name="stylesheet">the stylesheet to remove comments from</param>
        /// <returns>stylesheet without comments</returns>
        private static string RemoveStylesheetComments(string stylesheet)
        {
            StringBuilder sb = null;

            int prevIdx = 0, startIdx = 0;
            while (startIdx > -1 && startIdx < stylesheet.Length)
            {
                startIdx = stylesheet.IndexOf("/*", startIdx);
                if(startIdx > -1)
                {
                    if (sb == null)
                        sb = new StringBuilder(stylesheet.Length);
                    sb.Append(stylesheet.Substring(prevIdx, startIdx - prevIdx));

                    var endIdx = stylesheet.IndexOf("*/", startIdx + 2);
                    if (endIdx < 0)
                        endIdx = stylesheet.Length;

                    prevIdx = startIdx = endIdx + 2;
                }
                else if(sb != null)
                {
                    sb.Append(stylesheet.Substring(prevIdx));
                }
            }
            
            return sb != null ? sb.ToString() : stylesheet;
        }

        /// <summary>
        /// Parse given stylesheet for CSS blocks<br/>
        /// This blocks are added under the "all" keyword.
        /// </summary>
        /// <param name="cssData">the CSS data to fill with parsed CSS objects</param>
        /// <param name="stylesheet">the stylesheet to parse</param>
        private static void ParseStyleBlocks(CssData cssData, string stylesheet)
        {
            var startIdx = 0;
            int endIdx = 0;
            while (startIdx < stylesheet.Length && endIdx > -1)
            {
                endIdx = startIdx;
                while (endIdx + 1 < stylesheet.Length)
                {
                    endIdx++;
                    if (stylesheet[endIdx] == '}')
                        startIdx = endIdx + 1;
                    if (stylesheet[endIdx] == '{')
                        break;
                }

                int midIdx = endIdx + 1;
                if (endIdx > -1)
                {
                    endIdx++;
                    while (endIdx < stylesheet.Length)
                    {
                        if (stylesheet[endIdx] == '{')
                            startIdx = midIdx + 1;
                        if (stylesheet[endIdx] == '}')
                            break;
                        endIdx++;
                    }

                    if (endIdx < stylesheet.Length)
                    {
                        while (Char.IsWhiteSpace(stylesheet[startIdx]))
                            startIdx++;
                        var substring = stylesheet.Substring(startIdx, endIdx - startIdx + 1);
                        FeedStyleBlock(cssData, substring);
                    }
                    startIdx = endIdx + 1;
                }
            }
        }

        /// <summary>
        /// Parse given stylesheet for media CSS blocks<br/>
        /// This blocks are added under the specific media block they are found.
        /// </summary>
        /// <param name="cssData">the CSS data to fill with parsed CSS objects</param>
        /// <param name="stylesheet">the stylesheet to parse</param>
        private static void ParseMediaStyleBlocks(CssData cssData, string stylesheet)
        {
            int startIdx = 0;
            string atrule;
            while ((atrule = RegexParserUtils.GetCssAtRules(stylesheet, ref startIdx)) != null)
            {
                //Just processs @media rules
                if (!atrule.StartsWith("@media")) continue;

                //Extract specified media types
                MatchCollection types = RegexParserUtils.Match(RegexParserUtils.CssMediaTypes, atrule);

                if (types.Count == 1)
                {
                    string line = types[0].Value;

                    if (line.StartsWith("@media") && line.EndsWith("{"))
                    {
                        //Get specified media types in the at-rule
                        string[] media = line.Substring(6, line.Length - 7).Split(' ');

                        //Scan media types
                        foreach (string t in media)
                        {
                            if (!String.IsNullOrEmpty(t.Trim()))
                            {
                                //Get blocks inside the at-rule
                                var insideBlocks = RegexParserUtils.Match(RegexParserUtils.CssBlocks, atrule);

                                //Scan blocks and feed them to the style sheet
                                foreach (Match insideBlock in insideBlocks)
                                {
                                    FeedStyleBlock(cssData, insideBlock.Value, t.Trim());
                                }
                            }
                        }
                    }
                }
            }
        }

        /// <summary>
        /// Feeds the style with a block about the specific media.<br/>
        /// When no media is specified, "all" will be used.
        /// </summary>
        /// <param name="cssData"> </param>
        /// <param name="block">the CSS block to handle</param>
        /// <param name="media">optional: the media (default - all)</param>
        private static void FeedStyleBlock(CssData cssData, string block, string media = "all")
        {
            int startIdx = block.IndexOf("{", StringComparison.Ordinal);
            int endIdx = startIdx > -1 ? block.IndexOf("}", startIdx) : -1;
            if (startIdx > -1 && endIdx > -1)
            {
                string blockSource = block.Substring(startIdx + 1, endIdx - startIdx - 1);
                var classes = block.Substring(0, startIdx).Split(',');

                foreach (string cls in classes)
                {
                    string className = cls.Trim();
                    if (!String.IsNullOrEmpty(className))
                    {
                        var newblock = ParseCssBlockImp(className, blockSource);
                        if (newblock != null)
                        {
                            cssData.AddCssBlock(media, newblock);
                        }
                    }
                }
            }
        }

        /// <summary>
        /// Parse single CSS block source into CSS block instance.
        /// </summary>
        /// <param name="className">the name of the css class of the block</param>
        /// <param name="blockSource">the CSS block to parse</param>
        /// <returns>the created CSS block instance</returns>
        private static CssBlock ParseCssBlockImp(string className, string blockSource)
        {
            string psedoClass = null;
            var colonIdx = className.IndexOf(":", StringComparison.Ordinal);
            if (colonIdx > -1 && !className.StartsWith("::"))
            {
                psedoClass = colonIdx < className.Length - 1 ? className.Substring(colonIdx + 1).Trim() : null;
                className = className.Substring(0, colonIdx).Trim();
            }

            if (!string.IsNullOrEmpty(className) && (psedoClass == null || psedoClass == "link" || psedoClass == "hover"))
            {
                string firstClass;
                var selectors = ParseCssBlockSelector(className, out firstClass);

                var properties = ParseCssBlockProperties(blockSource);

                return new CssBlock(firstClass, properties, selectors, psedoClass == "hover");
            }

            return null;
        }

        /// <summary>
        /// Parse css block selector to support hierarchical selector (p class1 > class2).
        /// </summary>
        /// <param name="className">the class selector to parse</param>
        /// <param name="firstClass">return the main class the css block is on</param>
        /// <returns>returns the hierarchy of classes or null if single class selector</returns>
        private static List<CssBlockSelectorItem> ParseCssBlockSelector(string className, out string firstClass)
        {
            List<CssBlockSelectorItem> selectors = null;

            firstClass = null;
            int endIdx = className.Length - 1;
            while (endIdx > -1)
            {
                bool directParent = false;
                while (char.IsWhiteSpace(className[endIdx]) || className[endIdx] == '>')
                {
                    directParent = directParent || className[endIdx] == '>';
                    endIdx--;
                }

                var startIdx = endIdx;
                while (startIdx > -1 && !char.IsWhiteSpace(className[startIdx]) && className[startIdx] != '>')
                    startIdx--;

                if (startIdx > -1)
                {
                    if (selectors == null)
                        selectors = new List<CssBlockSelectorItem>();

                    var subclass = className.Substring(startIdx + 1, endIdx - startIdx);

                    if (firstClass == null)
                    {
                        firstClass = subclass;
                    }
                    else
                    {
                        while (char.IsWhiteSpace(className[startIdx]) || className[startIdx] == '>')
                            startIdx--;
                        selectors.Add(new CssBlockSelectorItem(subclass, directParent));
                    }
                }
                else if (firstClass != null)
                {
                    selectors.Add(new CssBlockSelectorItem(className.Substring(0, endIdx + 1), directParent));
                }

                endIdx = startIdx;
            }

            firstClass = firstClass ?? className;
            return selectors;
        }

        /// <summary>
        /// Parse the properties of the given css block into a key-value dictionary.
        /// </summary>
        /// <param name="blockSource">the raw css block to parse</param>
        /// <returns>dictionary with parsed css block properties</returns>
        private static Dictionary<string, string> ParseCssBlockProperties(string blockSource)
        {
            var properties = new Dictionary<string, string>();
            int startIdx = 0;
            while (startIdx < blockSource.Length)
            {
                int endIdx = blockSource.IndexOfAny(_cssBlockSplitters, startIdx);
                if (endIdx < 0)
                    endIdx = blockSource.Length - 1;

                var splitIdx = blockSource.IndexOf(':', startIdx, endIdx - startIdx);
                if (splitIdx > -1)
                {
                    //Extract property name and value
                    startIdx = startIdx + (blockSource[startIdx] == ' ' ? 1 : 0);
                    var adjEndIdx = endIdx - (blockSource[endIdx] == ' ' || blockSource[endIdx] == ';' ? 1 : 0);
                    string propName = blockSource.Substring(startIdx, splitIdx - startIdx).Trim();
                    splitIdx = splitIdx + (blockSource[splitIdx + 1] == ' ' ? 2 : 1);
                    if (adjEndIdx >= splitIdx)
                    {
                        string propValue = blockSource.Substring(splitIdx, adjEndIdx - splitIdx + 1);
                        AddProperty(propName, propValue, properties);
                    }
                }
                startIdx = endIdx + 1;
            }
            return properties;
        }

        /// <summary>
        /// Add the given property to the given properties collection, if the property is complex containing
        /// multiple css properties then parse them and add the inner properties.
        /// </summary>
        /// <param name="propName">the name of the css property to add</param>
        /// <param name="propValue">the value of the css property to add</param>
        /// <param name="properties">the properties collection to add to</param>
        private static void AddProperty(string propName, string propValue, Dictionary<string, string> properties)
        {
            // remove !important css crap
            propValue = propValue.Replace("!important", string.Empty).Trim();

            if (propName == "width" || propName == "height" || propName == "lineheight")
            {
                ParseLengthProperty(propName, propValue, properties);
            }
            else if (propName == "color" || propName == "backgroundcolor" || propName == "bordertopcolor" || propName == "borderbottomcolor" || propName == "borderleftcolor" || propName == "borderrightcolor")
            {
                 ParseColorProperty(propName, propValue, properties);
            }
            else if (propName == "font")
            {
                ParseFontProperty(propValue, properties);
            }
            else if (propName == "border")
            {
                ParseBorderProperty(propValue, null, properties);
            }
            else if (propName == "border-left")
            {
                ParseBorderProperty(propValue, "-left", properties);
            }
            else if (propName == "border-top")
            {
                ParseBorderProperty(propValue, "-top", properties);
            }
            else if (propName == "border-right")
            {
                ParseBorderProperty(propValue, "-right", properties);
            }
            else if (propName == "border-bottom")
            {
                ParseBorderProperty(propValue, "-bottom", properties);
            }
            else if (propName == "margin")
            {
                ParseMarginProperty(propValue, properties);
            }
            else if (propName == "border-style")
            {
                ParseBorderStyleProperty(propValue, properties);
            }
            else if (propName == "border-width")
            {
                ParseBorderWidthProperty(propValue, properties);
            }
            else if (propName == "border-color")
            {
                ParseBorderColorProperty(propValue, properties);
            }
            else if (propName == "padding")
            {
                ParsePaddingProperty(propValue, properties);
            }
            else if (propName == "background-image")
            {
                properties["background-image"] = ParseBackgroundImageProperty(propValue);
            }
            else if (propName == "font-family")
            {
                properties["font-family"] = ParseFontFamilyProperty(propValue);
            }
            else
            {
                properties[propName] = propValue;
            }
        }

        /// <summary>
        /// Parse length property to add only valid lengths.
        /// </summary>
        /// <param name="propName">the name of the css property to add</param>
        /// <param name="propValue">the value of the css property to add</param>
        /// <param name="properties">the properties collection to add to</param>
        private static void ParseLengthProperty(string propName, string propValue, Dictionary<string, string> properties)
        {
            if (CssValueParser.IsValidLength(propValue) || propValue.Equals(CssConstants.Auto,StringComparison.OrdinalIgnoreCase))
            {
                properties[propName] = propValue;
            }
        }

        /// <summary>
        /// Parse color property to add only valid color.
        /// </summary>
        /// <param name="propName">the name of the css property to add</param>
        /// <param name="propValue">the value of the css property to add</param>
        /// <param name="properties">the properties collection to add to</param>
        private static void ParseColorProperty(string propName, string propValue, Dictionary<string, string> properties)
        {
            if (CssValueParser.IsColorValid(propValue))
            {
                properties[propName] = propValue;
            }
        }

        /// <summary>
        /// Parse a complex font property value that contains multiple css properties into specific css properties.
        /// </summary>
        /// <param name="propValue">the value of the property to parse to specific values</param>
        /// <param name="properties">the properties collection to add the specific properties to</param>
        private static void ParseFontProperty(string propValue, Dictionary<string, string> properties)
        {
            int mustBePos;
            string mustBe = RegexParserUtils.Search(RegexParserUtils.CssFontSizeAndLineHeight, propValue, out mustBePos);

            if (!string.IsNullOrEmpty(mustBe))
            {
                mustBe = mustBe.Trim();
                //Check for style||variant||weight on the left
                string leftSide = propValue.Substring(0, mustBePos);
                string fontStyle = RegexParserUtils.Search(RegexParserUtils.CssFontStyle, leftSide);
                string fontVariant = RegexParserUtils.Search(RegexParserUtils.CssFontVariant, leftSide);
                string fontWeight = RegexParserUtils.Search(RegexParserUtils.CssFontWeight, leftSide);

                //Check for family on the right
                string rightSide = propValue.Substring(mustBePos + mustBe.Length);
                string fontFamily = rightSide.Trim(); //Parser.Search(Parser.CssFontFamily, rightSide); //TODO: Would this be right?

                //Check for font-size and line-height
                string fontSize = mustBe;
                string lineHeight = string.Empty;

                if (mustBe.Contains("/") && mustBe.Length > mustBe.IndexOf("/", StringComparison.Ordinal) + 1)
                {
                    int slashPos = mustBe.IndexOf("/", StringComparison.Ordinal);
                    fontSize = mustBe.Substring(0, slashPos);
                    lineHeight = mustBe.Substring(slashPos + 1);
                }

                if (!string.IsNullOrEmpty(fontFamily)) properties["font-family"] = ParseFontFamilyProperty(fontFamily);
                if (!string.IsNullOrEmpty(fontStyle)) properties["font-style"] = fontStyle;
                if (!string.IsNullOrEmpty(fontVariant)) properties["font-variant"] = fontVariant;
                if (!string.IsNullOrEmpty(fontWeight)) properties["font-weight"] = fontWeight;
                if (!string.IsNullOrEmpty(fontSize)) properties["font-size"] = fontSize;
                if (!string.IsNullOrEmpty(lineHeight)) properties["line-height"] = lineHeight;
            }
            else
            {
                // Check for: caption | icon | menu | message-box | small-caption | status-bar
                //TODO: Interpret font values of: caption | icon | menu | message-box | small-caption | status-bar
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="propValue">the value of the property to parse</param>
        /// <returns>parsed value</returns>
        private static string ParseBackgroundImageProperty(string propValue)
        {
            int startIdx = propValue.IndexOf("url(", StringComparison.Ordinal);
            if(startIdx > -1)
            {
                startIdx += 4;
                var endIdx = propValue.IndexOf(')', startIdx);
                if(endIdx > -1)
                {
                    endIdx -= 1;
                    while (startIdx < endIdx && (char.IsWhiteSpace(propValue[startIdx]) || propValue[startIdx] == '\''))
                        startIdx++;
                    while (startIdx < endIdx && (char.IsWhiteSpace(propValue[endIdx]) || propValue[endIdx] == '\''))
                        endIdx--;

                    if (startIdx <= endIdx)
                        return propValue.Substring(startIdx, endIdx - startIdx + 1);
                }
            }
            return propValue;
        }

        /// <summary>
        /// Parse a complex font family css property to check if it contains multiple fonts and if the font exists.<br/>
        /// returns the font family name to use or 'inherit' if failed.
        /// </summary>
        /// <param name="propValue">the value of the property to parse</param>
        /// <returns>parsed font-family value</returns>
        private static string ParseFontFamilyProperty(string propValue)
        {
            int start = 0;
            while(start > -1 && start < propValue.Length)
            {
                while (char.IsWhiteSpace(propValue[start]) || propValue[start] == ',' || propValue[start] == '\'' || propValue[start] == '"')
                    start++;
                var end = propValue.IndexOf(',', start);
                if(end < 0)
                    end = propValue.Length;
                var adjEnd = end - 1;
                while (char.IsWhiteSpace(propValue[adjEnd]) || propValue[adjEnd] == '\'' || propValue[adjEnd] == '"')
                    adjEnd--;

                var font = propValue.Substring(start, adjEnd - start + 1);

                if (FontsUtils.IsFontExists(font))
                {
                    return font;
                }

                start = end;
            }
            
            return CssConstants.Inherit;
        }

        /// <summary>
        /// Parse a complex border property value that contains multiple css properties into specific css properties.
        /// </summary>
        /// <param name="propValue">the value of the property to parse to specific values</param>
        /// <param name="direction">the left, top, right or bottom direction of the border to parse</param>
        /// <param name="properties">the properties collection to add the specific properties to</param>
        private static void ParseBorderProperty(string propValue, string direction, Dictionary<string, string> properties)
        {
            string borderWidth;
            string borderStyle;
            string borderColor;
            CssValueParser.ParseBorder(propValue, out borderWidth, out borderStyle, out borderColor);

            if (direction != null)
            {
                if (borderWidth != null) properties["border" + direction + "-width"] = borderWidth;
                if (borderStyle != null) properties["border" + direction + "-style"] = borderStyle;
                if (borderColor != null) properties["border" + direction + "-color"] = borderColor;
            }
            else
            {
                if (borderWidth != null) ParseBorderWidthProperty(borderWidth, properties);
                if (borderStyle != null) ParseBorderStyleProperty(borderStyle, properties);
                if (borderColor != null) ParseBorderColorProperty(borderColor, properties);
            }
        }

        /// <summary>
        /// Parse a complex margin property value that contains multiple css properties into specific css properties.
        /// </summary>
        /// <param name="propValue">the value of the property to parse to specific values</param>
        /// <param name="properties">the properties collection to add the specific properties to</param>
        private static void ParseMarginProperty(string propValue, Dictionary<string, string> properties)
        {
            string bottom, top, left, right;
            SplitMultiDirectionValues(propValue, out left, out top, out right, out bottom);

            if (left != null) properties["margin-left"] = left;
            if (top != null) properties["margin-top"] = top;
            if (right != null) properties["margin-right"] = right;
            if (bottom != null) properties["margin-bottom"] = bottom;
        }

        /// <summary>
        /// Parse a complex border style property value that contains multiple css properties into specific css properties.
        /// </summary>
        /// <param name="propValue">the value of the property to parse to specific values</param>
        /// <param name="properties">the properties collection to add the specific properties to</param>
        private static void ParseBorderStyleProperty(string propValue, Dictionary<string, string> properties)
        {
            string bottom, top, left, right;
            SplitMultiDirectionValues(propValue, out left, out top, out right, out bottom);

            if (left != null) properties["border-left-style"] = left;
            if (top != null) properties["border-top-style"] = top;
            if (right != null) properties["border-right-style"] = right;
            if (bottom != null) properties["border-bottom-style"] = bottom;
        }

        /// <summary>
        /// Parse a complex border width property value that contains multiple css properties into specific css properties.
        /// </summary>
        /// <param name="propValue">the value of the property to parse to specific values</param>
        /// <param name="properties">the properties collection to add the specific properties to</param>
        private static void ParseBorderWidthProperty(string propValue, Dictionary<string, string> properties)
        {
            string bottom, top, left, right;
            SplitMultiDirectionValues(propValue, out left, out top, out right, out bottom);

            if (left != null) properties["border-left-width"] = left;
            if (top != null) properties["border-top-width"] = top;
            if (right != null) properties["border-right-width"] = right;
            if (bottom != null) properties["border-bottom-width"] = bottom;
        }

        /// <summary>
        /// Parse a complex border color property value that contains multiple css properties into specific css properties.
        /// </summary>
        /// <param name="propValue">the value of the property to parse to specific values</param>
        /// <param name="properties">the properties collection to add the specific properties to</param>
        private static void ParseBorderColorProperty(string propValue, Dictionary<string, string> properties)
        {
            string bottom, top, left, right;
            SplitMultiDirectionValues(propValue, out left, out top, out right, out bottom);

            if (left != null) properties["border-left-color"] = left;
            if (top != null) properties["border-top-color"] = top;
            if (right != null) properties["border-right-color"] = right;
            if (bottom != null) properties["border-bottom-color"] = bottom;
        }

        /// <summary>
        /// Parse a complex padding property value that contains multiple css properties into specific css properties.
        /// </summary>
        /// <param name="propValue">the value of the property to parse to specific values</param>
        /// <param name="properties">the properties collection to add the specific properties to</param>
        private static void ParsePaddingProperty(string propValue, Dictionary<string, string> properties)
        {
            string bottom, top, left, right;
            SplitMultiDirectionValues(propValue, out left, out top, out right, out bottom);

            if (left != null) properties["padding-left"] = left;
            if (top != null) properties["padding-top"] = top;
            if (right != null) properties["padding-right"] = right;
            if (bottom != null) properties["padding-bottom"] = bottom;
        }

        /// <summary>
        /// Split multi direction value into the proper direction values (left, top, right, bottom).
        /// </summary>
        private static void SplitMultiDirectionValues(string propValue, out string left, out string top, out string right, out string bottom)
        {
            top = null;
            left = null;
            right = null;
            bottom = null;
            string[] values = SplitValues(propValue);
            switch (values.Length)
            {
                case 1:
                    top = left = right = bottom = values[0];
                    break;
                case 2:
                    top = bottom = values[0];
                    left = right = values[1];
                    break;
                case 3:
                    top = values[0];
                    left = right = values[1];
                    bottom = values[2];
                    break;
                case 4:
                    top = values[0];
                    right = values[1];
                    bottom = values[2];
                    left = values[3];
                    break;
            }
        }

        /// <summary>
        /// Split the value by the specified separator; e.g. Useful in values like 'padding:5 4 3 inherit'
        /// </summary>
        /// <param name="value">Value to be splitted</param>
        /// <param name="separator"> </param>
        /// <returns>Splitted and trimmed values</returns>
        private static string[] SplitValues(string value, char separator = ' ')
        {
            //TODO: CRITICAL! Don't split values on parenthesis (like rgb(0, 0, 0)) or quotes ("strings")

            if (!string.IsNullOrEmpty(value))
            {
                string[] values = value.Split(separator);
                List<string> result = new List<string>();

                foreach (string t in values)
                {
                    string val = t.Trim();

                    if (!string.IsNullOrEmpty(val))
                    {
                        result.Add(val);
                    }
                }

                return result.ToArray();
            }

            return new string[0];
        }

        #endregion
    }
}