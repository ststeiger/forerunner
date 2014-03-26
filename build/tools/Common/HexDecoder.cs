//-----------------------------------------------------------------------
// <copyright file="HexDecoder.cs" company="Jon Rowlett">
//     Copyright (C) 2010 Jon Rowlett. All rights reserved.
// </copyright>
// <author>Jon Rowlett</author>
//-----------------------------------------------------------------------
namespace Common.Text
{
    using System;
    using System.Collections.Generic;
    using System.Text;
    using Common.Internal;

    /// <summary>
    /// Decodes a series of bytes into a hex string representation.
    /// </summary>
    public class HexDecoder : Decoder
    {
        /// <summary>
        /// Gets the count of chars required to decode.
        /// </summary>
        /// <param name="bytes">bytes to decode</param>
        /// <param name="index">indes into bytes</param>
        /// <param name="count">count of bytes</param>
        /// <returns>the number of chars required.</returns>
        public override int GetCharCount(byte[] bytes, int index, int count)
        {
            Check.IsNotNull(bytes, "bytes", Tracing.Source);
            Check.IsGreaterThanOrEqual(index, 0, "index", Tracing.Source);
            Check.IsGreaterThanOrEqual(count, 0, "count", Tracing.Source);
            Check.IsInRange(count, "count", Tracing.Source, new Range<int>(0, Int32.MaxValue >> 1));
            Check.IsInRange(count, "count", Tracing.Source, new Range<int>(0, bytes.Length - index));
            return count * 2;
        }

        /// <summary>
        /// Decodes a series of bytes into hex chars.
        /// </summary>
        /// <param name="bytes">bytes to decode</param>
        /// <param name="byteIndex">starting index</param>
        /// <param name="byteCount">count of bytes</param>
        /// <param name="chars">destination array</param>
        /// <param name="charIndex">starting index into chars</param>
        /// <returns>the number of chars written</returns>
        public override int GetChars(byte[] bytes, int byteIndex, int byteCount, char[] chars, int charIndex)
        {
            Check.IsNotNull(bytes, "bytes", Tracing.Source);
            Check.IsNotNull(chars, "chars", Tracing.Source);
            Check.IsGreaterThanOrEqual(byteIndex, 0, "byteIndex", Tracing.Source);
            Check.IsGreaterThanOrEqual(charIndex, 0, "charIndex", Tracing.Source);
            Check.IsInRange(byteCount, "byteCount", Tracing.Source, new Range<int>(0, bytes.Length - byteIndex));
            Check.IsInRange(byteCount, "byteCount", Tracing.Source, new Range<int>(0, Int32.MaxValue >> 1));
            Check.IsInRange(charIndex, "charIndex", Tracing.Source, new Range<int>(0, chars.Length - (byteCount * 2)));

            for (int source = byteIndex, dest = charIndex; source < byteCount + byteIndex; source++, dest += 2)
            {
                chars[dest] = ConvertDigit(bytes[source] >> 4);
                chars[dest + 1] = ConvertDigit(bytes[source] & 0x0f);
            }

            return byteCount * 2;
        }

        /// <summary>
        /// converts a value less than 16 to a single hex digit.
        /// </summary>
        /// <param name="value">the value to convert</param>
        /// <returns>the char from the value</returns>
        private static char ConvertDigit(int value)
        {
            Check.IsInRange(value, "value", Tracing.Source, new Range<int>(0, 15));
            if (value < 10)
            {
                return (char)((int)'0' + (int)value);
            }
            else 
            {
                return (char)((int)'a' + (int)value - 10);
            }
        }
    }
}
