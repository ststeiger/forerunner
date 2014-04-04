//-----------------------------------------------------------------------
// <copyright file="HexEncoder.cs" company="Jon Rowlett">
//     Copyright (C) 2010 Jon Rowlett. All rights reserved.
// </copyright>
// <author>Jon Rowlett</author>
//-----------------------------------------------------------------------
namespace Common.Text
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Text;
    using Common.Diagnostics;
    using Common.Internal;

    /// <summary>
    /// Encodes a string representation of hex chars into their byte values.
    /// </summary>
    public class HexEncoder : Encoder
    {
        /// <summary>
        /// the high order digit left over if the caller passes an odd number of chars
        /// </summary>
        private int byteInProgress = -1;

        /// <summary>
        /// gets the number of bytes needed to encode the given char buffer
        /// </summary>
        /// <param name="chars">the source chars</param>
        /// <param name="index">the starting index</param>
        /// <param name="count">the count of chars</param>
        /// <param name="flush">whether or not the buffer will be flushed</param>
        /// <returns>the number of bytes needed</returns>
        public override int GetByteCount(char[] chars, int index, int count, bool flush)
        {
            Check.IsNotNull(chars, "chars", Tracing.Source);
            Check.IsGreaterThanOrEqual(index, 0, "index", Tracing.Source);
            Check.IsInRange(count, "count", Tracing.Source, new Range<int>(0, chars.Length - index));
            
            return GetMaxByteCount(count);
        }

        /// <summary>
        /// Encodes a sequence of chars
        /// </summary>
        /// <param name="chars">the char buffer</param>
        /// <param name="charIndex">the starting index into chars</param>
        /// <param name="charCount">the count of chars</param>
        /// <param name="bytes">the destination buffer</param>
        /// <param name="byteIndex">the starting index into bytes</param>
        /// <param name="flush">true to flush buffer</param>
        /// <returns>the number of bytes encoded</returns>
        public override int GetBytes(char[] chars, int charIndex, int charCount, byte[] bytes, int byteIndex, bool flush)
        {
            Check.IsNotNull(chars, "chars", Tracing.Source);
            Check.IsNotNull(bytes, "bytes", Tracing.Source);
            Check.IsGreaterThanOrEqual(byteIndex, 0, "byteIndex", Tracing.Source);
            Check.IsGreaterThanOrEqual(charIndex, 0, "charIndex", Tracing.Source);
            Check.IsInRange(charCount, "charCount", Tracing.Source, new Range<int>(0, chars.Length - charIndex));
            Check.IsInRange(byteIndex, "byteIndex", Tracing.Source, new Range<int>(0, chars.Length - GetMaxByteCount(charCount) - 1));

            int dest = byteIndex;
            for (int source = charIndex; source < charCount + charIndex; source++)
            {
                if (this.byteInProgress >= 0)
                {
                    int lowDigit = ConvertChar(chars[source]);
                    bytes[dest++] = (byte)((this.byteInProgress << 4) | lowDigit);
                    this.byteInProgress = -1;
                }
                else
                {
                    this.byteInProgress = ConvertChar(chars[source]);
                }
            }
            
            if (flush && this.byteInProgress >= 0)
            {
                bytes[dest++] = (byte)(this.byteInProgress << 4);
                this.byteInProgress = -1;
            }

            return dest - byteIndex;
        }

        /// <summary>
        /// Gets the number of bytes needed given the charCount input
        /// </summary>
        /// <param name="charCount">count of chars</param>
        /// <returns>count of chars divided by 2 and remainder included</returns>
        internal static int GetMaxByteCount(int charCount)
        {
            uint overflow = (uint)charCount + 1;
            return (int)(overflow >> 1);
        }

        /// <summary>
        /// Converts a single hex digit into its numeric form
        /// </summary>
        /// <param name="ch">input char</param>
        /// <returns>the hex value</returns>
        private static int ConvertChar(char ch)
        {
            int value = -1;
            if ((int)ch >= '0' && (int)ch <= '9')
            {
                value = (int)ch - (int)'0';
            }
            else if ((int)ch >= 'a' && (int)ch <= 'f')
            {
                value = (int)ch - (int)'a' + 10;
            }
            else if ((int)ch >= 'A' && (int)ch <= 'F')
            {
                value = (int)ch - (int)'A' + 10;
            }
            else
            {
                throw TraceUtility.TraceThrowException(
                    Tracing.Source,
                    new FormatException(),
                    TraceEventType.Error);
            }

            return value;
        }
    }
}
