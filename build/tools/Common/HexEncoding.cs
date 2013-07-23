//-----------------------------------------------------------------------
// <copyright file="HexEncoding.cs" company="Jon Rowlett">
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
    /// Encodes a byte array into a string of hex digits.
    /// </summary>
    public class HexEncoding : Encoding
    {
        /// <summary>
        /// The singleton instance
        /// </summary>
        private static HexEncoding hex = new HexEncoding();
 
        /// <summary>
        /// The encoder
        /// </summary>
        private HexEncoder encoder = new HexEncoder();
        
        /// <summary>
        /// The decoder
        /// </summary>
        private HexDecoder decoder = new HexDecoder();

        /// <summary>
        /// Initializes a new instance of the HexEncoding class.
        /// </summary>
        protected HexEncoding()
            : base()
        {
        }

        /// <summary>
        /// Gets the singleton encoding.
        /// </summary>
        public static HexEncoding Hex
        {
            get
            {
                return hex;
            }
        }

        /// <summary>
        /// Gets the number of bytes required to encode the given chars.
        /// </summary>
        /// <param name="chars">the chars to encode</param>
        /// <param name="index">the starting index</param>
        /// <param name="count">the count of chars</param>
        /// <returns>the number of bytes required</returns>
        public override int GetByteCount(char[] chars, int index, int count)
        {
            return this.encoder.GetByteCount(chars, index, count, true);
        }

        /// <summary>
        /// Encodes a sequence of chars into bytes.
        /// </summary>
        /// <param name="chars">the char buffer</param>
        /// <param name="charIndex">the starting index in chars</param>
        /// <param name="charCount">the count of characters in chars</param>
        /// <param name="bytes">the output buffer</param>
        /// <param name="byteIndex">the starting index in bytes</param>
        /// <returns>the number of bytes written</returns>
        public override int GetBytes(char[] chars, int charIndex, int charCount, byte[] bytes, int byteIndex)
        {
            return this.encoder.GetBytes(chars, charIndex, charCount, bytes, byteIndex, true);
        }

        /// <summary>
        /// Gets the count of chars needed to decode the bytes
        /// </summary>
        /// <param name="bytes">byte input</param>
        /// <param name="index">starting index into bytes</param>
        /// <param name="count">count of bytes</param>
        /// <returns>the number of chars needed</returns>
        public override int GetCharCount(byte[] bytes, int index, int count)
        {
            return this.decoder.GetCharCount(bytes, index, count, true);
        }

        /// <summary>
        /// Decodes the bytes into chars.
        /// </summary>
        /// <param name="bytes">input bytes</param>
        /// <param name="byteIndex">starting index into bytes</param>
        /// <param name="byteCount">count of bytes</param>
        /// <param name="chars">output buffer</param>
        /// <param name="charIndex">starting index into char</param>
        /// <returns>the number of chars decoded</returns>
        public override int GetChars(byte[] bytes, int byteIndex, int byteCount, char[] chars, int charIndex)
        {
            return this.decoder.GetChars(bytes, byteIndex, byteCount, chars, charIndex, true);
        }

        /// <summary>
        /// Gets the maximum number of bytes needed to encode the given number of chars
        /// </summary>
        /// <param name="charCount">the number of chars</param>
        /// <returns>the maximum number of bytes needed to encode</returns>
        public override int GetMaxByteCount(int charCount)
        {
            return HexEncoder.GetMaxByteCount(charCount);
        }

        /// <summary>
        /// Gets the maximum number of chars needed to decode the given number of bytes.
        /// </summary>
        /// <param name="byteCount">count of bytes</param>
        /// <returns>the maximum number of chars needed to decode</returns>
        public override int GetMaxCharCount(int byteCount)
        {
            Check.IsInRange(byteCount, "byteCount", Tracing.Source, new Range<int>(0, Int32.MaxValue >> 1));
            return byteCount << 1;
        }

        /// <summary>
        /// Gets the decoder
        /// </summary>
        /// <returns>a decoder that can be used with this encoding</returns>
        public override Decoder GetDecoder()
        {
            return this.decoder;
        }

        /// <summary>
        /// Gets the encoder
        /// </summary>
        /// <returns>an encoded that can be used with this encoding</returns>
        public override Encoder GetEncoder()
        {
            return this.encoder;
        }
    }
}
